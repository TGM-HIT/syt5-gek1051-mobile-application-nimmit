### Register Page 
---
mach mir eine schöne register seite im stil von #file:settings.ts 

ich habe keine email verification in meinem project deswegen wird der user gleich erstellt sobald .register() aufgerufen wird. ändere die #file:register.html und #file:register.ts so, dass schön angezeigt wird, dass die registrierung erfolgreich war (es sei denn es gab einen error) und dann wird nach 5 sekunden auf die main page weitergeleitet

ich will den username nicht in data speichern. speichere ihn in profiles des users 

ändere es so, dass der user .signUp nur gemacht wird wenn der username in der profiles table uniqe ist


### Account Page
---

Mach mir eine account seite die im style genau so ist wie die #file:settings.ts page und schau dir alle attribute von #file:supabase.ts an und zeige sie schön an. außerdem soll ein edit mode per toggle button aktiviert werden können womit man seinen username und den sync_interval in einem slider ändern kann

### Login Page
---

bau mir eine login seite die vom style genau so aussieht wie meine #file:register page und leite mich automatisch auf die account seite weiter 

ich bekomme auf der account page wenn ich nicht eingeloggt bin (Auth session missing!) das ist ein supabase error soll aber custom abgefangen werden