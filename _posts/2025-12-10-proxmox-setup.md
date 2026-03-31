---
title: Proxmox & Docker Setup for Self-Hosted Infrastructure
date: 2025-12-10 12:00:00 -500
categories: [Notes]
tags: [proxmox, docker, self-hosting, wordpress, homelab, cloudflare]
image:
  path: assets/attachments/proxmox-setup.png
---

Self-hosting was something I wanted to build properly instead of relying only on cloud platforms. The goal of this setup was to create a solid local infrastructure using Proxmox, run services inside a dedicated Ubuntu VM with Docker, and securely expose selected services using Cloudflare Tunnel.

This setup currently runs WordPress, MariaDB, Portainer, and Nginx Proxy Manager, and it also serves as the base for future lab expansion.

## Overview

The overall setup consists of:

- **Proxmox VE** as the hypervisor
- **Ubuntu Server VM** as the Docker host
- **ZFS storage** for allocating larger VM disks
- **Docker containers** for service deployment
- **Cloudflare Tunnel** for external access without port forwarding

The services deployed in this setup are:

- WordPress
- MariaDB
- Portainer
- Nginx Proxy Manager

## 1. Proxmox Setup

The first step was installing Proxmox VE on the server and configuring the basic management network during installation.

After installation, Proxmox can be accessed from the browser using:

```text
https://<proxmox-ip>:8006
```

Once the web interface is available, the enterprise repositories should be disabled and replaced with the no-subscription repository.

In the Proxmox UI, go to:

* `Datacenter -> Node -> Updates -> Repositories`

Disable:

* `pve-enterprise`
* `ceph` enterprise repository if enabled

Then add the **No-Subscription** repository.

This avoids package update issues on a non-enterprise setup.

## 2. Creating ZFS Storage

A dedicated disk was prepared and used to create a ZFS pool. This allows larger VM disks to be allocated separately instead of keeping everything on the default storage.

On the Proxmox host, the disk was wiped and a new ZFS pool was created:

```bash
wipefs -a /dev/sda
sgdisk --zap-all /dev/sda
zpool create -f zfspool /dev/sda
zpool status
```

After creating the pool, it can be added in the Proxmox UI:

* `Datacenter -> Storage -> Add -> ZFS`

Select the newly created pool and enable the required content types such as disk images and containers.

## 3. Creating the Docker Host VM

An Ubuntu Server ISO was uploaded to Proxmox and used to create a dedicated VM for Docker.

Recommended VM settings:

* 2 to 4 CPU cores
* 4 to 6 GB RAM
* 50+ GB system disk
* Additional large disk from the ZFS pool
* OpenSSH Server enabled during Ubuntu installation

During the Ubuntu installation:

* use a normal server install
* install **OpenSSH Server**
* use the entire primary disk for the OS
* create a standard user account

After installation completes, remove the ISO from the VM hardware section before booting again.

In Proxmox:

* select the VM
* go to `Hardware`
* select the CD/DVD drive
* detach it or set media to `None`

## 4. Assigning a Static IP to the Docker VM

After the VM is installed, a static IP can be configured using Netplan.

First, check the existing netplan file:

```bash
ls /etc/netplan
```

Edit the file:

```bash
sudo nano /etc/netplan/*.yaml
```

Example configuration:

```yaml
network:
  version: 2
  ethernets:
    enp6s18:
      dhcp4: no
      addresses:
        - 192.168.1.60/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
```

Apply the configuration:

```bash
sudo netplan apply
```

Verify the assigned address:

```bash
ip addr show enp6s18
```

At this point, the VM should be reachable over SSH:

```bash
ssh <user>@192.168.1.60
```

## 5. Adding a Separate Disk for Docker Data

A separate disk was added to the VM from the ZFS pool so Docker data could be stored outside the root filesystem.

In Proxmox:

* select the VM
* go to `Hardware`
* click `Add -> Hard Disk`
* choose the ZFS pool
* allocate the required size, such as 500 GB

Inside the Ubuntu VM, the new disk was formatted and mounted to `/var/lib/docker`.

First, identify the disk:

```bash
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE
```

Then format and mount it:

```bash
sudo mkfs.ext4 /dev/sdb1
sudo mkdir -p /var/lib/docker
sudo mount /dev/sdb1 /var/lib/docker
```

To make the mount persistent across reboots:

```bash
echo "/dev/sdb1 /var/lib/docker ext4 defaults 0 2" | sudo tee -a /etc/fstab
sudo mount -a
```

This keeps Docker images, volumes, and containers on the larger dedicated disk.

## 6. Installing Docker

Docker was installed using Docker’s official repository instead of the default Ubuntu package.

First install prerequisites:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
```

Add Docker’s GPG key:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

Add the Docker repository:

```bash
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Install Docker:

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Enable the service:

```bash
sudo systemctl enable docker --now
```

Add the current user to the Docker group:

```bash
sudo usermod -aG docker $USER
sudo reboot
```

After reboot, Docker should work without `sudo`.

## 7. Installing Portainer

Portainer was used to manage containers and stacks from a web interface.

Create the Portainer volume:

```bash
docker volume create portainer_data
```

Run Portainer:

```bash
docker run -d \
  -p 9443:9443 \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Access Portainer at:

```bash
https://192.168.1.60:9443
```

From there, the local Docker environment can be managed through the browser.

## 8. Deploying Nginx Proxy Manager

Nginx Proxy Manager was deployed using a Portainer stack.

In Portainer, go to:

* `Stacks -> Add stack`

Use the following compose file:

```yaml
version: "3.9"

services:
  npm:
    image: jc21/nginx-proxy-manager:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "81:81"
      - "443:443"
    environment:
      TZ: "Asia/Kolkata"
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt

volumes:
  npm_data:
  npm_letsencrypt:
```

Once deployed, the Nginx Proxy Manager admin interface is available at:

```bash
http://192.168.1.60:81
```

This is used later to create reverse proxy entries for services.

## 9. Deploying WordPress and MariaDB

WordPress and MariaDB were deployed together using Docker Compose.

In Portainer, create another stack with the following file:

```yaml
version: "3.9"

services:
  mariadb:
    image: mariadb:10.7
    container_name: mariadb
    restart: always
    environment:
      MYSQL_DATABASE: wpdb
      MYSQL_USER: wpuser
      MYSQL_PASSWORD: <your-password>
      MYSQL_ROOT_PASSWORD: <your-password>
    volumes:
      - db_data:/var/lib/mysql

  wordpress:
    image: wordpress:latest
    container_name: wordpress
    restart: always
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: mariadb
      WORDPRESS_DB_NAME: wpdb
      WORDPRESS_DB_USER: wpuser
      WORDPRESS_DB_PASSWORD: <your-password>
    volumes:
      - wp_data:/var/www/html

volumes:
  db_data:
  wp_data:
```

After deployment, WordPress is accessible at:

```bash
http://192.168.1.60:8080
```

At this point, the WordPress initial setup can be completed from the browser.

## 10. Configuring Nginx Proxy Manager

After WordPress is running, a reverse proxy entry can be created in Nginx Proxy Manager.

In Nginx Proxy Manager:

* go to `Hosts -> Proxy Hosts -> Add Proxy Host`
* set the domain name
* forward to the Docker VM IP and WordPress port
* enable SSL if required

For local-only testing, a temporary hostname can also be added to the Windows hosts file:

```text
C:\Windows\System32\drivers\etc\hosts
```

Example entry:

```text
192.168.1.60 wp.local
```

This allows the site to be accessed using a custom local name before exposing it externally.

## 11. Installing Cloudflare Tunnel

Cloudflare Tunnel was used to expose local services securely without port forwarding and without requiring a static public IP.

Install `cloudflared` inside the Docker host VM:

```bash
sudo apt update
sudo apt install -y wget
cd /tmp
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo apt install ./cloudflared-linux-amd64.deb
cloudflared --version
```

Authenticate with Cloudflare:

```bash
cloudflared tunnel login
```

This opens a browser and asks for Cloudflare authentication and domain selection.

Create the tunnel:

```bash
cloudflared tunnel create wp-tunnel
```

Create the Cloudflare config directory:

```bash
mkdir -p ~/.cloudflared
```

Then create the tunnel configuration file:

```bash
nano ~/.cloudflared/config.yml
```

Example configuration:

```yaml
tunnel: wp-tunnel
credentials-file: /home/<user>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: yourdomain.com
    service: http://192.168.1.60:8080
  - hostname: portainer.yourdomain.com
    service: https://192.168.1.60:9443
    originRequest:
      noTLSVerify: true
  - hostname: npm.yourdomain.com
    service: http://192.168.1.60:81
  - hostname: proxmox.yourdomain.com
    service: https://<proxmox-ip>:8006
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

Create the DNS route for the hostname:

```bash
cloudflared tunnel route dns wp-tunnel yourdomain.com
```

Install the tunnel as a service:

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

This makes the selected services accessible through Cloudflare-managed hostnames.

## 12. Optional: macvlan Networking for Static Container IPs

A separate internal network was later created to give containers their own fixed IP addresses.

First, add a second network adapter to the Docker VM in Proxmox and attach it to a different bridge such as `vmbr1`.

Inside the VM, configure the interfaces with Netplan:

```yaml
network:
  version: 2
  ethernets:
    enp6s18:
      dhcp4: true
    enp6s19:
      dhcp4: no
      addresses:
        - 10.10.10.2/24
```

Apply the config:

```bash
sudo netplan apply
```

Then create the Docker macvlan network:

```bash
docker network create -d macvlan \
  --subnet=10.10.10.0/24 \
  --gateway=10.10.10.1 \
  -o parent=enp6s19 \
  dockernet
```

Attach containers with fixed IP addresses:

```bash
docker network connect --ip 10.10.10.10 dockernet portainer
docker network connect --ip 10.10.10.20 dockernet nginx-proxy-manager-npm-1
docker network connect --ip 10.10.10.30 dockernet wordpress
docker network connect --ip 10.10.10.40 dockernet mariadb
```

A macvlan shim can also be created using a systemd service so the host can communicate with the macvlan containers.

Create a systemd service:

```bash
sudo nano /etc/systemd/system/macvlan-shim.service
```
Add the following content:
```text
[Unit]
Description=Create macvlan shim and routes for Docker macvlan containers
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes

ExecStart=/bin/sh -c '/usr/sbin/ip link add macvlan-shim link enp6s19 type macvlan mode bridge || true'
ExecStart=/bin/sh -c '/usr/sbin/ip addr add 10.10.10.3/24 dev macvlan-shim || true'
ExecStart=/usr/sbin/ip link set macvlan-shim up

ExecStart=/usr/sbin/ip route replace 10.10.10.10/32 dev macvlan-shim
ExecStart=/usr/sbin/ip route replace 10.10.10.20/32 dev macvlan-shim
ExecStart=/usr/sbin/ip route replace 10.10.10.30/32 dev macvlan-shim
ExecStart=/usr/sbin/ip route replace 10.10.10.40/32 dev macvlan-shim

[Install]
WantedBy=multi-user.target
```
Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable macvlan-shim.service
sudo systemctl start macvlan-shim.service
```

## Final Result

At the end of this setup, the environment provides:

* Proxmox-based virtualization
* A dedicated Ubuntu Docker host
* Separate Docker storage on a larger disk
* Portainer for container management
* Nginx Proxy Manager for reverse proxying
* WordPress and MariaDB running locally
* Cloudflare Tunnel for secure external access
* Optional static container networking with macvlan

