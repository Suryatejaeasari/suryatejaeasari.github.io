(() => {
  'use strict';
  // BASE Phase 2: public fictional challenge environment only. No credential issuance/auth here.
  const screen = document.querySelector('#screen');
  const form = document.querySelector('#command-form');
  const input = document.querySelector('#command-input');
  const prompt = document.querySelector('#prompt');
  if (!screen || !form || !input || !prompt) return;
  const HOME = '/home/user';
  let cwd = HOME, historyCursor = 0, started = false, hintLevel = 0;
  const history = [];
  const API = 'https://api.base.easari.com';
  let role = 'user', completed = false, busy = false;
  async function api(path, options={}) {
    let response;
    try {
      response = await fetch(API + path, {credentials:'include',cache:'no-store',...options,
        headers: options.body ? {'Content-Type':'application/json',...(options.headers||{})} : (options.headers||{})});
    } catch { throw new Error('Cannot contact BASE API. Check your connection.'); }
    const data = await response.json().catch(()=>({error:'Unexpected API response'}));
    if (!response.ok) throw new Error(data.error || `API error (${response.status})`);
    return data;
  }
  async function initSession() {
    try {
      let data;
      try { data = await api('/session'); }
      catch { data = await api('/session',{method:'POST'}); }
      role = data.role === 'challenger' ? 'challenger' : 'user';
      if (role === 'challenger') completed = true;
      else {
        const status = await api('/challenges/CH-001/status');
        completed = !!status.completed;
        if (completed) role = 'challenger';
      }
      if (completed && !filesystem[HOME].children.includes('access-01.key')) filesystem[HOME].children.push('access-01.key');
      updatePrompt();
      emit('[ OK ] Secure BASE session connected.','ok');
    } catch (error) { emit(`[!] ${error.message} Browser challenge submissions are unavailable.`, 'output warn'); }
  }
  async function submitAnswer(answer) {
    const result = await api('/challenges/CH-001/submit',{
      method:'POST',body:JSON.stringify({answer})
    });
    if (!result.completed) throw new Error('Challenge was not completed.');
    completed = true; role = 'challenger'; updatePrompt();
    filesystem[HOME].children.includes('access-01.key') || filesystem[HOME].children.push('access-01.key');
    return '[+] CH-001 verified.\n[+] Role updated: challenger.\n[+] A new file is available: access-01.key\nUse cat access-01.key to issue and read your personal access certificate.';
  }
  async function showKey() {
    if (!completed) return 'cat: access-01.key: Complete CH-001 first.';
    const data = await api('/rewards/CH-001/issue',{method:'POST'});
    return `BASE ACCESS CERTIFICATE\n------------------------------\nChallenge : ${data.challenge_id}\nResource  : ${data.resource_id}\nStatus    : ${data.status.toUpperCase()}\n\nSECRET: ${data.secret}\n------------------------------\nUse unlock WR-001 to redeem your key.`;
  }
  async function unlockResource(code) {
    if (!code) return 'Usage: unlock WR-001 <code>';
    const data=await api('/resources/WR-001/unlock',{method:'POST',body:JSON.stringify({code})});
    return data.unlocked ? '[+] WR-001 unlocked. Use cat writeups/WR-001.md to read it.' : 'Unlock failed.';
  }
  async function readResource() {
    const response=await fetch(API+'/resources/WR-001/content',{credentials:'include',cache:'no-store'});
    if (!response.ok) { const data=await response.json().catch(()=>({})); throw new Error(data.error||`Resource request failed (${response.status})`); }
    return response.text();
  }
  const filesystem = {
    '/': {type:'dir', children:['home']},
    '/home': {type:'dir', children:['user']},
    [HOME]: {type:'dir', children:['README.txt','projects','writeups','documents','.operator']},
    [HOME+'/README.txt']: {type:'file', text:'BASE SYSTEM\n-----------\nWelcome to the simulated terminal.\nUse help to explore the environment.\nPortfolio details are available on the main blog.\nChallenge: challenge start CH-001'},
    [HOME+'/projects']: {type:'dir', children:['README.txt']},
    [HOME+'/projects/README.txt']: {type:'file', text:'For projects and portfolio information, use exit to visit the main BASE blog.'},
    [HOME+'/writeups']: {type:'dir', children:['README.txt']},
    [HOME+'/writeups/README.txt']: {type:'file', text:'Protected writeups are not bundled with this public terminal. Vault integration arrives in a later phase.'},
    [HOME+'/documents']: {type:'dir', children:['welcome.txt','notes.txt','archive.log']},
    [HOME+'/documents/welcome.txt']: {type:'file', text:'BASE // SYSTEM NOTICE\n\nThis is a simulated terminal environment.\nAvailable documents may contain remnants of previous system activity.\nSystem integrity: OK'},
    [HOME+'/documents/notes.txt']: {type:'file', text:'OPERATOR NOTES\n--------------\nThe handover was never completed.\nBefore leaving, the operator mentioned that the terminal history might explain what happened.\nNo access credentials were included in the public handover.'},
    [HOME+'/documents/archive.log']: {type:'file', text:'[08:17:02] Archive initialized.\n[08:18:44] Public documents synchronized.\n[08:21:09] Workspace integrity verified.\n[08:24:31] Operator session interrupted.\n[08:25:00] Handover incomplete.'},
    [HOME+'/.operator']: {type:'dir', children:['history.log','message.enc','fragments']},
    [HOME+'/.operator/history.log']: {type:'file', text:'101 pwd\n102 ls -la\n103 cd /home/user/.operator\n104 ls\n105 cd fragments\n106 ls -la\n107 cat fragment-a.txt\n108 cat fragment-b.txt\n109 cd ..\n110 cat message.enc\n111 echo "Remember the order."\n112 exit'},
    [HOME+'/.operator/message.enc']: {type:'file', text:'ENCODING: BASE64\n\nU29ydCBmcmFnbWVudHMgYnkgdGltZXN0YW1wIChvbGRlc3QgZmlyc3QpLiBKb2luIFRPS0VOIHZhbHVlcyB3aXRoIGEgaHlwaGVuIGFuZCBwcmVmaXggQkFTRS0u'},
    [HOME+'/.operator/fragments']: {type:'dir', children:['fragment-a.txt','fragment-b.txt']},
    [HOME+'/.operator/fragments/fragment-a.txt']: {type:'file', text:'BASE OPERATOR FRAGMENT\n\nFILE ID   : A\nTIMESTAMP : 2026-10-17T08:42:00Z\nTOKEN     : SIGNAL\nSTATUS    : RECOVERED'},
    [HOME+'/.operator/fragments/fragment-b.txt']: {type:'file', text:'BASE OPERATOR FRAGMENT\n\nFILE ID   : B\nTIMESTAMP : 2026-10-17T08:39:00Z\nTOKEN     : QUIET\nSTATUS    : RECOVERED'}
  };
  const help = [
    'BASE TERMINAL — AVAILABLE COMMANDS','',
    'SYSTEM COMMANDS',
    '  help                 Show available commands',
    '  ls [-la] [path]      List files (including hidden files)',
    '  cd [path]            Change directory',
    '  pwd                  Show current directory',
    '  cat <file>           Display file contents',
    '  base64 -d <file>     Decode a Base64 artifact',
    '  clear                Clear terminal output',
    '  history              Show your command history',
    '  whoami               Show current role',
    '  date                 Display date and time',
    '  echo <text>          Print text',
    '  man <command>        Command documentation',
    '  neofetch             Show system information',
    '  exit                 Return to blog','',
    'CHALLENGE COMMANDS',
    '  challenge list       List challenges',
    '  challenge start CH-001   Begin investigation',
    '  challenge hint CH-001    Reveal next hint',
    '  challenge submit CH-001 <phrase>   Verify recovered phrase','',
    'VAULT COMMANDS',
    '  cat access-01.key    Retrieve your unique access code',
    '  unlock WR-001 <code> Redeem issued code',
    '  cat writeups/WR-001.md  Read unlocked writeup',
    '  vault                Show vault information','',
    'Use man <command> for more information.'
  ].join('\n');
  const available = ['help','ls','cd','pwd','cat','base64','clear','history','whoami','date','echo','man','neofetch','exit','challenge','vault','unlock','sudo'];
  const manuals = {
    help: ['Show categorized available commands.', 'Usage: help'],
    ls: ['List directory contents, including hidden names with -a or -la.', 'Usage: ls [-la] [path]'],
    cd: ['Change virtual directory. .. means parent and ~ means home.', 'Usage: cd [path]', 'Example: cd documents'],
    pwd: ['Display the current virtual directory.', 'Usage: pwd'],
    cat: ['Read a virtual file, not files from the real server.', 'Usage: cat <file>', 'Example: cat README.txt'],
    base64: ['Decode Base64 data from a virtual evidence file.', 'Usage: base64 -d <file>'],
    clear: ['Clear terminal output.', 'Usage: clear'],
    history: ['Display your command history (not operator history.log).', 'Usage: history'],
    whoami: ['Display the active terminal role.', 'Usage: whoami'],
    date: ['Display the current device date and time.', 'Usage: date'],
    echo: ['Print text.', 'Usage: echo <text>'],
    man: ['Show a short manual for a command.', 'Usage: man <command> [subcommand]', 'Example: man challenge start'],
    neofetch: ['Display BASE simulated system information.', 'Usage: neofetch'],
    exit: ['Return to the main blog. Root-mode behavior is planned for later.', 'Usage: exit'],
    challenge: ['Investigate CH-001. Answers are verified by the BASE API.', 'Usage: challenge <list|start|hint|submit> [id] [phrase]'],
    'challenge list': ['List challenges.', 'Usage: challenge list'],
    'challenge start': ['Start The Forgotten Operator investigation.', 'Usage: challenge start CH-001'],
    'challenge hint': ['Reveal the next hint (three available).', 'Usage: challenge hint CH-001'],
    'challenge submit': ['Submit a phrase for secure verification.', 'Usage: challenge submit CH-001 <phrase>'],
    vault: ['Show vault status. Locked content is delivered by the API.', 'Usage: vault'],
    unlock: ['Redeem your visitor-specific code for WR-001.', 'Usage: unlock WR-001 <code>'],
    sudo: ['Reserved for future secure owner authentication. Do not enter real passwords here.', 'Status: not enabled']
  };
  function manual(args) {
    if (!args.length) return 'Usage: man <command> [subcommand]';
    const key = args.slice(0, 2).join(' ').toLowerCase();
    const name = Object.hasOwn(manuals, key) ? key : args[0].toLowerCase();
    return Object.hasOwn(manuals, name) ? `BASE MANUAL — ${name.toUpperCase()}\n\n${manuals[name].join('\n')}` : `No manual entry for ${args.join(' ')}. Type help for available commands.`;
  }
  const hints = [
    'Visibility can be misleading. Your usual directory listing might be hiding something.',
    'The previous operator left a workspace and a command history behind. Investigate both.',
    'Decode message.enc, then arrange the fragments chronologically rather than alphabetically.'
  ];
  function emit(text, cls='output') {if(!text)return;const d=document.createElement('div');d.className=cls;d.textContent=text;screen.insertBefore(d,form);screen.scrollTop=screen.scrollHeight;}
  function normalize(path='.') {if(path==='~'||path.startsWith('~/'))path=HOME+path.slice(1);const parts=path.startsWith('/')?[]:cwd.split('/').filter(Boolean);for(const segment of path.split('/')){if(!segment||segment==='.')continue;if(segment==='..')parts.pop();else parts.push(segment);}return '/'+parts.join('/');}
  function here(){return cwd===HOME?'~':cwd.startsWith(HOME+'/')?'~'+cwd.slice(HOME.length):cwd;}
  function updatePrompt(){prompt.textContent=`${role}@base:${here()}$`;}
  function get(path){return filesystem[normalize(path)];}
  function listing(path, all){const e=get(path);if(!e)return `ls: cannot access '${path}': No such file or directory`;if(e.type==='file')return path;return (all?['.','..',...e.children]:e.children.filter(x=>!x.startsWith('.'))).join('  ')||'(empty)';}
  function decodeFile(path) {if(!path)return 'Usage: base64 -d <file>';const f=get(path);if(!f)return `base64: ${path}: No such file`;if(f.type!=='file')return `base64: ${path}: Is a directory`;const encoded=f.text.split(/\s+/).find(x=>x.length>30&&/^[A-Za-z0-9+/]+={0,2}$/.test(x));if(!encoded)return 'base64: no encoded payload found';try{return atob(encoded)}catch{return 'base64: invalid encoded payload'}}
  function challenge(args){const [op,id,...answer]=args;if(!op||op==='list')return `ID       NAME                    STATUS\n---------------------------------------------\nCH-001   The Forgotten Operator  ${completed?'COMPLETED':'AVAILABLE'}`;if(id!=='CH-001')return 'challenge: unknown challenge ID. Use challenge list.';
    if(op==='start'){started=true;return '[+] Challenge environment initialized.\n\nINCIDENT REPORT #001\nThe previous system operator disappeared without completing the final handover.\nSeveral artifacts remain in the workspace. The visible files may not tell the entire story.\n\nMISSION: Recover the operator\'s final access phrase and submit it for verification.\n\nCurrent directory: '+cwd;}
    if(op==='hint'){if(!started)return 'Start the challenge first: challenge start CH-001';hintLevel=Math.min(hintLevel+1,hints.length);return `HINT ${String(hintLevel).padStart(2,'0')}: ${hints[hintLevel-1]}`;}
    if(op==='submit'){if(!started && !completed)return 'Start the challenge first: challenge start CH-001';if(!answer.length && !completed)return 'Usage: challenge submit CH-001 <recovered phrase>';return submitAnswer(answer.join(' '));}
    return 'Usage: challenge list | challenge start CH-001 | challenge hint CH-001 | challenge submit CH-001 <phrase>';
  }
  async function execute(raw){const args=(raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)||[]).map(v=>v.replace(/^(['"])(.*)\1$/,'$2'));const [c,...rest]=args;const cmd=(c||'').toLowerCase(), first=rest[0];switch(cmd){
    case 'help':return help;
    case 'ls':return listing(rest.find(x=>!x.startsWith('-'))||'.',rest.some(x=>x.startsWith('-')&&x.includes('a')));
    case 'pwd':return cwd;
    case 'cd':{const dest=normalize(first||HOME), e=filesystem[dest];if(!e)return `cd: ${first}: No such directory`;if(e.type!=='dir')return `cd: ${first}: Not a directory`;cwd=dest;updatePrompt();return '';}
    case 'cat':{if(!first)return 'cat: missing file operand';if(normalize(first)===HOME+'/access-01.key')return showKey();if(normalize(first)===HOME+'/writeups/WR-001.md')return readResource();const e=get(first);return !e?`cat: ${first}: No such file`:(e.type==='dir'?`cat: ${first}: Is a directory`:e.text);}
    case 'base64':return first==='-d'?decodeFile(rest[1]):'Usage: base64 -d <file>';
    case 'clear':[...screen.children].forEach(n=>{if(n!==form)n.remove()});return '';
    case 'history':return history.map((v,i)=>`${i+1}  ${v}`).join('\n');
    case 'whoami':return role;
    case 'date':return new Date().toString();
    case 'echo':return rest.join(' ');
    case 'man':return manual(rest);
    case 'neofetch':return `BASE_\nOS: BASE browser simulation\nShell: base-sh 3.0\nRole: ${role}\nHost: base.easari.com`;
    case 'challenge':return challenge(rest);
    case 'vault':return 'WR-001 — SEALED (CH-001). Complete the challenge, cat access-01.key, then unlock WR-001 <code>.';
    case 'unlock':return first==='WR-001'?unlockResource(rest[1]):'Usage: unlock WR-001 <code>';
    case 'sudo':return 'Owner authentication is not enabled. Do not enter passwords in this Phase 2 terminal.';
    case 'exit':emit('[+] Closing terminal session...\n[+] Returning to BASE.');window.location.assign(document.documentElement.dataset.homeUrl||'/');return '';
    default:return `${c}: command not found. Type help.`;
  }}
  form.addEventListener('submit',async e=>{
    e.preventDefault(); if(busy)return;
    const raw=input.value.trim(); if(!raw)return;
    busy=true; input.disabled=true; input.value='';
    const sensitive=/^unlock\s/i.test(raw);
    history.push(sensitive?'unlock WR-001 [REDACTED]':raw);
    historyCursor=history.length;
    emit(`${prompt.textContent} ${sensitive?'unlock WR-001 [REDACTED]':raw}`,'echo prompt-text');
    try { const out=await execute(raw); emit(out,/not found|not enabled|No such|missing|Usage:|unknown|denied|incorrect|failed|first/i.test(out||'')?'output warn':'output'); }
    catch(error){emit(error.message||'Request failed','output warn');}
    finally {busy=false;input.disabled=false;input.focus();screen.scrollTop=screen.scrollHeight;}
  });
  // Context-aware Tab completion: commands, challenge subcommands/IDs, and file paths.
  function completePath(part, directoriesOnly = false) {
    const slash = part.lastIndexOf('/');
    const base = slash >= 0 ? part.slice(0, slash + 1) : '';
    const prefix = slash >= 0 ? part.slice(slash + 1) : part;
    const dir = get(base || '.');
    if (!dir || dir.type !== 'dir') return [];
    return dir.children.filter(name => name.startsWith(prefix)).filter(name => {
      const item = filesystem[normalize(base + name)];
      return !directoriesOnly || item?.type === 'dir';
    }).map(name => base + name + (filesystem[normalize(base + name)]?.type === 'dir' ? '/' : ''));
  }
  function completeInput() {
    const value = input.value;
    const tokens = value.trimStart().split(/\s+/);
    const endsSpace = /\s$/.test(value);
    const part = endsSpace ? '' : tokens.pop() || '';
    if (endsSpace) { /* all current tokens are complete */ }
    // tokens now holds all arguments before the unfinished token.
    const cmd = (tokens[0] || '').toLowerCase();
    let options = [];
    let appendSpace = true;
    if (tokens.length === 0) {
      options = available.filter(name => name.startsWith(part.toLowerCase()));
    } else if (cmd === 'challenge') {
      if (tokens.length === 1) {
        options = ['list', 'start', 'hint', 'submit'].filter(name => name.startsWith(part.toLowerCase()));
      } else if (tokens.length === 2 && ['start', 'hint', 'submit'].includes(tokens[1].toLowerCase())) {
        options = ['CH-001'].filter(id => id.toLowerCase().startsWith(part.toLowerCase()));
      } else { return; } // The final answer is intentionally never suggested.
    } else if (['cat', 'cd', 'ls'].includes(cmd) && tokens.length >= 1) {
      options = completePath(part, cmd === 'cd');
      if(cmd==='cat' && completed && 'access-01.key'.startsWith(part))options.push('access-01.key');
      if(cmd==='cat' && 'writeups/WR-001.md'.startsWith(part))options.push('writeups/WR-001.md');
      appendSpace = !options.some(x => x.endsWith('/'));
    } else if (cmd === 'unlock' && tokens.length === 1) {
      options = ['WR-001'].filter(x=>x.toLowerCase().startsWith(part.toLowerCase()));
    } else if (cmd === 'base64') {
      if (tokens.length === 1) options = ['-d'].filter(x => x.startsWith(part));
      else if (tokens.length === 2 && tokens[1] === '-d') options = completePath(part);
      else return;
    } else if (cmd === 'man' && tokens.length === 1) {
      options = available.filter(name => name.startsWith(part.toLowerCase()));
    } else if (cmd === 'man' && tokens.length === 2 && tokens[1].toLowerCase() === 'challenge') {
      options = ['list', 'start', 'hint', 'submit'].filter(name => name.startsWith(part.toLowerCase()));
    } else return;
    if (options.length === 1) {
      // Do not force a space after directories, allowing deeper path completion.
      input.value = [...tokens, options[0]].join(' ') + (appendSpace && !options[0].endsWith('/') ? ' ' : '');
    } else if (options.length > 1) emit(options.join('  '));
  }
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') {
      e.preventDefault(); historyCursor = Math.max(0, historyCursor - 1); input.value = history[historyCursor] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); historyCursor = Math.min(history.length, historyCursor + 1); input.value = history[historyCursor] || '';
    } else if (e.key === 'Tab') {
      e.preventDefault(); completeInput();
    } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
      e.preventDefault(); [...screen.children].forEach(n => { if (n !== form) n.remove(); });
    }
  });
  document.querySelector('.shell').addEventListener('click',e=>{if(!e.target.closest('a,input'))input.focus()});
  updatePrompt();
  initSession();
})();
