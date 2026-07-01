alter table public.call_logs
add column if not exists script_text text,
add column if not exists script_language text,
add column if not exists audio_url text,
add column if not exists audio_status text default 'not_generated',
add column if not exists audio_provider text,
add column if not exists audio_generated_at timestamptz;

alter table public.voice_settings
add column if not exists speech_speed text default 'normal',
add column if not exists respect_mode text default 'formal';

create index if not exists call_logs_audio_status_idx
on public.call_logs (audio_status);

create index if not exists call_logs_script_language_idx
on public.call_logs (script_language);
