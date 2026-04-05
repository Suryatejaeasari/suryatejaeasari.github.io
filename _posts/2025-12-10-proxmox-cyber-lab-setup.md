---
title: Proxmox-Based Cybersecurity Lab - Active Directory, Monitoring & Malware Analysis
date: 2026-04-05 12:00:00 +0530
categories: [Projects]
tags: [proxmox, active-directory, wazuh, suricata, kali, remnux, homelab, detection]
image:
  path: assets/attachments/cyber-lab.png
---

Most cybersecurity labs focus on isolated machines and exploitation practice.  
This setup was designed differently — to simulate a structured internal environment with segmentation, monitoring, and controlled attack paths.

The objective was to move beyond basic attack labs and build a controlled environment that reflects both attacker and defender perspectives, focusing on how systems are designed, monitored, and attacked.

## Overview

The overall setup consists of:

- **Proxmox VE** as the hypervisor
- **Segmented internal networks** for isolation
- **Active Directory environment**
- **Monitoring stack (Wazuh + Suricata + Sysmon)**
- **Dedicated attacker VM (Kali)**
- **Isolated malware analysis environment (MAL01 + REMnux)**

This architecture mirrors real enterprise environments where production systems, monitoring infrastructure, and high-risk analysis zones are strictly separated.

![Proxmox Server](/assets/attachments/proxmox-lab.png)

## Architecture Diagram

![Cyber Lab Architecture](/assets/attachments/cyber-lab-architecture.png)

## 1. Lab Architecture Design

The architecture was intentionally segmented into three zones:

### Victim Network (vmbr2)
- Subnet: `172.16.10.0/24`
- Simulates a small internal enterprise environment

Systems:
- DC01 (Domain Controller)
- WS01, WS02 (Workstations)
- WEB01 (Linux web server)
- KALI (Attacker VM)

### Monitoring Network (vmbr3)
- Subnet: `172.16.20.0/24`

System:
- MON01 (Monitoring server)

MON01 has dual interfaces:
- vmbr3 → monitoring
- vmbr2 → visibility into victim network

### Malware Network (vmbr4)
- Subnet: `10.50.50.0/24`

Systems:
- MAL01 (Windows detonation VM)
- REM01 (REMnux analysis VM)

This separation ensures safe experimentation while also reflecting how real environments isolate production systems, monitoring infrastructure, and high-risk analysis zones.

## 2. Proxmox Network Segmentation

Separate Linux bridges were created in Proxmox:

- `vmbr2` → victim network  
- `vmbr3` → monitoring network  
- `vmbr4` → malware network  

Important design decision:

- No physical NIC attached  
- No gateway configured  

This ensures **complete isolation from external networks**.

## 3. Building the Domain Controller (DC01)

A Windows Server 2019 VM was created to act as the domain controller.

Key roles:

- Active Directory Domain Services  
- DNS  
- Authentication  

Configuration:

- Domain: `corp.local`
- Static IP: `172.16.10.10`

After setup, a snapshot was taken to preserve a clean state.

## 4. Configuring Active Directory Environment

To simulate a realistic environment:

### Organizational Units (OU)
- Servers
- Workstations
- Users
- ServiceAccounts
- Groups

### Users
- alice
- bob
- charlie
- david

### Service Accounts
- svc_sql
- svc_backup

### Admin
- itadmin (added to Domain Admins)

This structure mimics a typical enterprise AD setup.

## 5. Creating Domain Workstations

Two Windows 10 systems were added:

- WS01 → `172.16.10.20`
- WS02 → `172.16.10.21`

Steps:

- Install Windows 10  
- Configure static IP  
- Set DNS to DC01  
- Join domain `corp.local`  

This enables realistic internal communication and authentication flows.

## 6. Adding WEB01 (Linux Target)

An Ubuntu Server VM was created:

- IP: `172.16.10.30`
- Connected to victim network

Purpose:

- Simulate web-based attack scenarios  
- Host vulnerable applications  
- Extend lab beyond Windows  

## 7. Adding Kali (Attacker VM)

A Kali VM was added inside the victim network:

- IP: `172.16.10.50`

Why inside the lab:

- Internal attack simulation  
- Faster testing  
- Supports pivoting scenarios  
- Fully self-contained environment  

## 8. Building the Monitoring Stack (MON01)

This is the most critical component of the lab.

MON01 configuration:

- NIC1 → vmbr3 (`172.16.20.10`)
- NIC2 → vmbr2 (`172.16.10.40`)

### Tools Installed

- **Wazuh** → SIEM + dashboard  
- **Sysmon** → Windows event logging  
- **Suricata** → network IDS  

### Key Design Decisions

- Disabled IP forwarding (prevents pivoting)
- Restricted firewall rules
- Acts as an observer, not a participant

This transforms the lab into a **detection environment**, not just an attack lab.

This design ensures monitoring does not become a pivot point, maintaining visibility without introducing risk.

## 9. Malware Detonation Environment (MAL01)

A dedicated Windows VM for malware analysis:

- IP: `10.50.50.10`
- Network: vmbr4 (isolated)

### Tools Installed

- Sysmon  
- Sysinternals Suite  
- Wireshark  
- FakeNet-NG  
- PE analysis tools  
- Debuggers  

Security measures:

- Windows Defender disabled (controlled testing)
- No external network access
- Snapshot created for rollback

The malware network is intentionally isolated with no routing or external access to prevent unintended spread or contamination.

## 10. REMnux Analysis VM

REM01 was added using a prebuilt image:

- IP: `10.50.50.20`
- Network: vmbr4

Purpose:

- Linux-based malware analysis  
- Network inspection  
- Static and dynamic analysis  

This complements MAL01 for deeper analysis workflows.

## Final Lab Layout

### Victim Network
- DC01 → 172.16.10.10  
- WS01 → 172.16.10.20  
- WS02 → 172.16.10.21  
- WEB01 → 172.16.10.30  
- MON01 → 172.16.10.40  
- KALI → 172.16.10.50  

### Monitoring Network
- MON01 → 172.16.20.10  

### Malware Network
- MAL01 → 10.50.50.10  
- REM01 → 10.50.50.20  

## What This Lab Enables

- Active Directory administration  
- Internal network simulation  
- Attack path analysis  
- SIEM-based detection  
- Endpoint telemetry analysis  
- Network traffic inspection  
- Safe malware detonation  
- Full attacker-to-defender visibility  

## Key Takeaways

- Segmentation is more important than scale  
- Monitoring adds more value than adding more targets  
- Snapshots make experimentation safe  
- Realism comes from structure, not complexity  
- Understanding both attack and detection is essential  

## What Makes This Lab Different

- Designed with segmentation from the beginning instead of a flat network  
- Includes both offensive (Kali) and defensive (Wazuh, Suricata, Sysmon) components  
- Dedicated malware analysis zone instead of mixing environments  
- Focused on visibility and detection, not just exploitation  

## Conclusion

This lab evolved from a simple setup into a structured environment that reflects real-world architecture.

The most valuable part was not deploying systems, but designing how they interact, how they are monitored, and how they can be safely tested.

This foundation can now be extended into advanced attack simulations, detection engineering, and real-world incident analysis workflows.