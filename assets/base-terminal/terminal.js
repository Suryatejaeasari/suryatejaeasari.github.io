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
    '  challenge submit CH-001 <phrase>   Check puzzle progress','',
    'VAULT (SECURE BACKEND COMING LATER)',
    '  vault                Show current implementation status','',
    'Use man <command> for more information.'
  ].join('\n');
  const available = ['help','ls','cd','pwd','cat','base64','clear','history','whoami','date','echo','man','neofetch','exit','challenge','vault','sudo'];
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
    challenge: ['Investigate CH-001. Secure verification is not yet enabled.', 'Usage: challenge <list|start|hint|submit> [id] [phrase]'],
    'challenge list': ['List challenges.', 'Usage: challenge list'],
    'challenge start': ['Start The Forgotten Operator investigation.', 'Usage: challenge start CH-001'],
    'challenge hint': ['Reveal the next hint (three available).', 'Usage: challenge hint CH-001'],
    'challenge submit': ['Submit a phrase; verification and rewards are not yet enabled.', 'Usage: challenge submit CH-001 <phrase>'],
    vault: ['Show vault implementation status; protected content is not public.', 'Usage: vault'],
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
  function updatePrompt(){prompt.textContent=`user@base:${here()}$`;}
  function get(path){return filesystem[normalize(path)];}
  function listing(path, all){const e=get(path);if(!e)return `ls: cannot access '${path}': No such file or directory`;if(e.type==='file')return path;return (all?['.','..',...e.children]:e.children.filter(x=>!x.startsWith('.'))).join('  ')||'(empty)';}
  function decodeFile(path) {if(!path)return 'Usage: base64 -d <file>';const f=get(path);if(!f)return `base64: ${path}: No such file`;if(f.type!=='file')return `base64: ${path}: Is a directory`;const encoded=f.text.split(/\s+/).find(x=>x.length>30&&/^[A-Za-z0-9+/]+={0,2}$/.test(x));if(!encoded)return 'base64: no encoded payload found';try{return atob(encoded)}catch{return 'base64: invalid encoded payload'}}
  function challenge(args){const [op,id,...answer]=args;if(!op||op==='list')return 'ID       NAME                    STATUS\n---------------------------------------------\nCH-001   The Forgotten Operator  AVAILABLE (local investigation)';if(id!=='CH-001')return 'challenge: unknown challenge ID. Use challenge list.';
    if(op==='start'){started=true;return '[+] Challenge environment initialized.\n\nINCIDENT REPORT #001\nThe previous system operator disappeared without completing the final handover.\nSeveral artifacts remain in the workspace. The visible files may not tell the entire story.\n\nMISSION: Recover the operator\'s final access phrase and submit it for verification.\n\nCurrent directory: '+cwd;}
    if(op==='hint'){if(!started)return 'Start the challenge first: challenge start CH-001';hintLevel=Math.min(hintLevel+1,hints.length);return `HINT ${String(hintLevel).padStart(2,'0')}: ${hints[hintLevel-1]}`;}
    if(op==='submit'){if(!started)return 'Start the challenge first: challenge start CH-001';if(!answer.length)return 'Usage: challenge submit CH-001 <recovered phrase>';return 'Submission received. Secure answer verification and individual access-01.key issuance are not enabled in Phase 2. No passcode or access entitlement has been granted.';}
    return 'Usage: challenge list | challenge start CH-001 | challenge hint CH-001 | challenge submit CH-001 <phrase>';
  }
  function execute(raw){const args=(raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)||[]).map(v=>v.replace(/^(['"])(.*)\1$/,'$2'));const [c,...rest]=args;const cmd=(c||'').toLowerCase(), first=rest[0];switch(cmd){
    case 'help':return help;
    case 'ls':return listing(rest.find(x=>!x.startsWith('-'))||'.',rest.some(x=>x.startsWith('-')&&x.includes('a')));
    case 'pwd':return cwd;
    case 'cd':{const dest=normalize(first||HOME), e=filesystem[dest];if(!e)return `cd: ${first}: No such directory`;if(e.type!=='dir')return `cd: ${first}: Not a directory`;cwd=dest;updatePrompt();return '';}
    case 'cat':{if(!first)return 'cat: missing file operand';const e=get(first);return !e?`cat: ${first}: No such file`:(e.type==='dir'?`cat: ${first}: Is a directory`:e.text);}
    case 'base64':return first==='-d'?decodeFile(rest[1]):'Usage: base64 -d <file>';
    case 'clear':[...screen.children].forEach(n=>{if(n!==form)n.remove()});return '';
    case 'history':return history.map((v,i)=>`${i+1}  ${v}`).join('\n');
    case 'whoami':return 'user';
    case 'date':return new Date().toString();
    case 'echo':return rest.join(' ');
    case 'man':return manual(rest);
    case 'neofetch':return 'BASE_\nOS: BASE browser simulation\nShell: base-sh 2.0\nRole: user\nHost: base.easari.com';
    case 'challenge':return challenge(rest);
    case 'vault':return 'Vault is reserved for the secure backend phase. Locked resource contents are not published in this frontend.';
    case 'sudo':return 'Owner authentication is not enabled. Do not enter passwords in this Phase 2 terminal.';
    case 'exit':emit('[+] Closing terminal session...\n[+] Returning to BASE.');window.location.assign(document.documentElement.dataset.homeUrl||'/');return '';
    default:return `${c}: command not found. Type help.`;
  }}
  form.addEventListener('submit',e=>{e.preventDefault();const raw=input.value.trim();if(!raw)return;history.push(raw);historyCursor=history.length;emit(`${prompt.textContent} ${raw}`,'echo prompt-text');input.value='';const out=execute(raw);emit(out,/not found|not enabled|No such|missing|Usage:|unknown|not published/.test(out)?'output warn':'output');input.focus();screen.scrollTop=screen.scrollHeight;});
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
      appendSpace = !options.some(x => x.endsWith('/'));
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
})();
