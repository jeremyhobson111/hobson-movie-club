# Email templates

Supabase keeps these in its dashboard, so this folder is the saved copy. To change one: edit here, then paste the file into Supabase > Authentication > Emails > Templates (needs custom SMTP).

| File | Template in Supabase | Subject |
|---|---|---|
| `magic-link.html` | Magic link or OTP | Your Hobson Movie Club sign-in |
| `invite.html` | Invite user | You're invited to Hobson Movie Club |

Notes: emails only support simple HTML, so layouts use tables and inline styles. The round logo in the header loads from https://hobsonmovieclub.com/img/icon-192.png, so do not rename or move that file. `{{ .ConfirmationURL }}` and `{{ .Token }}` are filled in by Supabase.
