select jsonb_build_object(
'tables',(select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity) order by c.relname) from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r'),
'columns',(select jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',udt_name,'nullable',is_nullable,'default',column_default) order by table_name,ordinal_position) from information_schema.columns where table_schema='public'),
'constraints',(select jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'name',conname,'definition',pg_get_constraintdef(oid)) order by conrelid::regclass::text,conname) from pg_constraint where connamespace='public'::regnamespace),
'indexes',(select jsonb_agg(jsonb_build_object('table',tablename,'name',indexname,'definition',indexdef) order by tablename,indexname) from pg_indexes where schemaname='public'),
'policies',(select jsonb_agg(jsonb_build_object('table',tablename,'name',policyname,'roles',roles,'command',cmd,'using',qual,'check',with_check) order by tablename,policyname) from pg_policies where schemaname='public'),
'functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definer',p.prosecdef,'config',p.proconfig,'definition',pg_get_functiondef(p.oid)) order by p.proname) from pg_proc p where p.pronamespace='public'::regnamespace),
'triggers',(select jsonb_agg(jsonb_build_object('table',tgrelid::regclass::text,'name',tgname,'definition',pg_get_triggerdef(oid)) order by tgrelid::regclass::text,tgname) from pg_trigger where not tgisinternal and tgrelid in(select oid from pg_class where relnamespace='public'::regnamespace))
) schema;
