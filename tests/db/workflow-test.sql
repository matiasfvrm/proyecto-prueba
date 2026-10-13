-- Exercises RLS and workflow functions. Any failed assertion aborts with an error.
\set ON_ERROR_STOP on
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a','alice@example.org'),
  ('00000000-0000-0000-0000-00000000000b','bob@example.org'),
  ('00000000-0000-0000-0000-00000000000c','carol@example.org');

create or replace function pg_temp.as_user(uid text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid, false), set_config('request.jwt.claim.role', 'authenticated', false);
$$;
-- Runs stmt and requires it to fail with an error message matching pattern.
create or replace function pg_temp.expect_error(stmt text, label text, pattern text) returns void language plpgsql as $$
begin
  begin execute stmt;
  exception when others then
    if sqlerrm not ilike pattern then raise exception '% failed for the wrong reason: %', label, sqlerrm; end if;
    raise notice 'ok (rejected): %', label; return;
  end;
  raise exception 'expected failure: %', label;
end $$;

set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into profiles(id, handle, name, role) values (auth.uid(), 'alice', 'Alice', 'moderator'); -- role forced to contributor
do $$ begin assert (select role from profiles where handle='alice') = 'contributor', 'role escalation on insert'; end $$;
select pg_temp.expect_error($$update profiles set role='moderator' where handle='alice'$$, 'self role change', '%role can only%');
select pg_temp.expect_error($$insert into profiles(id, handle, name) values ('00000000-0000-0000-0000-00000000000b','mallory','Mallory')$$, 'profile for another user', '%row-level security%');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into profiles(id, handle, name) values (auth.uid(), 'bob', 'Bob');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
insert into profiles(id, handle, name) values (auth.uid(), 'carol', 'Carol');

-- Admin promotes Bob to reviewer and Carol to moderator (direct SQL session, no JWT role).
reset role;
select set_config('request.jwt.claim.role', '', false);
update profiles set role='reviewer' where handle='bob';
update profiles set role='moderator' where handle='carol';
set role authenticated;

-- Catalog is read-only to users.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update tasks set status='completed' where id='t-water-1b'; -- no update policy: affects 0 rows
do $$ begin assert (select status from tasks where id='t-water-1b') = 'open', 'RLS let a user update tasks'; end $$;

-- Claim → submit → review.
select claim_task('t-water-1b');
select pg_temp.expect_error($$select claim_task('t-water-1b')$$, 'double claim', '%not open%');
select pg_temp.expect_error($$select claim_task('t-water-2b')$$, 'claim blocked task', '%not open%');
select pg_temp.expect_error($$insert into contributions(task_id, author_id, title, summary, kind) values ('t-water-1b', auth.uid(), 'Direct insert', 'xxxxxxxxxxxxxxxxxxxxxxxx', 'code')$$, 'direct contribution insert', '%row-level security%');
select pg_temp.expect_error($$select submit_contribution('t-water-1b','Notebook v1','Computes agreement statistics on synthetic data.','code', array['javascript:alert(1)'], false)$$, 'unsafe link', '%invalid link%');
select submit_contribution('t-water-1b','Notebook v1','Computes agreement statistics on synthetic data.','code', array['https://example.org/nb'], false);
do $$ begin assert (select status from tasks where id='t-water-1b') = 'in_review'; end $$;

select pg_temp.expect_error($$select review_contribution((select id from contributions where task_id='t-water-1b'), 'accept', 'Contributors cannot review', '{}')$$, 'contributor reviewing', '%only reviewers%');

-- A reviewer cannot review their own contribution.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select claim_task('t-water-3b');
select submit_contribution('t-water-3b','Converter v1','Converts CSV exports into schema-valid JSON records.','code', '{}', false);
select pg_temp.expect_error($$select review_contribution((select id from contributions where task_id='t-water-3b'), 'accept', 'Reviewing my own work here', (select acceptance_criteria from tasks where id='t-water-3b'))$$, 'self review', '%own contribution%');
select pg_temp.expect_error($$select review_contribution((select id from contributions where task_id='t-water-1b'), 'accept', 'Looks fine to me overall', '{}')$$, 'accept without criteria', '%criteria%');
select review_contribution((select id from contributions where task_id='t-water-1b'), 'accept', 'Meets every criterion listed.', (select acceptance_criteria from tasks where id='t-water-1b'));
do $$ begin
  assert (select status from tasks where id='t-water-1b') = 'completed';
  assert (select status from contributions where task_id='t-water-1b') = 'accepted';
  assert (select status from research_questions where id='q-water-1') = 'under_investigation', 'review changed evidence status';
end $$;

-- Submissions and moderation.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into problem_submissions(author_id, title, description, why_it_matters, category, evidence, sources, research_questions)
values (auth.uid(), 'A sufficiently long problem title', repeat('d', 60), 'Because it matters a lot.', 'water', 'Some evidence text.', array['https://example.org'], array['Is this a question?']);
select pg_temp.expect_error($$insert into problem_submissions(author_id, title, description, why_it_matters, category, evidence, sources, research_questions, status) values (auth.uid(), 'A sufficiently long problem title', repeat('d', 60), 'x', 'water', 'x', array['https://example.org'], array['Q?'], 'accepted')$$, 'self-accepted submission', '%row-level security%');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin assert (select count(*) from problem_submissions) = 0, 'pending submission visible to others'; end $$;
select pg_temp.expect_error($$select moderate_submission('problem_submission', (select id from problem_submissions limit 1), 'accepted')$$, 'reviewer moderating', '%only moderators%');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select moderate_submission('problem_submission', (select id from problem_submissions limit 1), 'accepted');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin assert (select count(*) from problem_submissions) = 1, 'accepted submission not public'; end $$;

-- Follows and reports are private.
insert into follows values (auth.uid(), 'p-water');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin assert (select count(*) from follows) = 0, 'follows leaked'; end $$;
insert into reports(reporter_id, target_type, target_id, reason) values (auth.uid(), 'contribution', 'x', 'spam');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin assert (select count(*) from reports) = 0, 'reports leaked'; end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
do $$ begin assert (select count(*) from reports) = 1, 'moderator cannot see reports'; end $$;

-- Anonymous visitors can read the catalog but not write.
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin assert (select count(*) from problems) = 7; end $$;
select pg_temp.expect_error($$select claim_task('t-water-3b')$$, 'anonymous claim', '%permission denied%');
reset role;
\echo 'ALL DATABASE TESTS PASSED'
