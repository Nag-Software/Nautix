-- SQL migration to add trigger enforcing per-user documents quota based on user_profiles.plan
-- WARNING: This migration assumes plan names contain 'matros' and 'maskinist' as in application code.

create or replace function enforce_docs_quota()
returns trigger
language plpgsql
as $$
declare
  pid text;
  docs_count int;
  dlimit int := 0;
begin
  if tg_op = 'INSERT' then
    pid := (select plan from public.user_profiles where id = new.user_id limit 1);
    if pid is null then
      -- if no plan, assume no limit
      dlimit := 0;
    else
      pid := lower(pid);
      if pid like '%matros%' then
        dlimit := 15;
      elsif pid like '%maskinist%' then
        dlimit := 30;
      else
        dlimit := 0;
      end if;
    end if;

    if dlimit > 0 then
      select count(*) into docs_count from public.documents where user_id = new.user_id;
      if docs_count >= dlimit then
        raise exception 'Document quota exceeded for user %', new.user_id;
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Attach trigger to documents table
drop trigger if exists documents_enforce_quota on public.documents;
create trigger documents_enforce_quota
before insert on public.documents
for each row execute function enforce_docs_quota();
