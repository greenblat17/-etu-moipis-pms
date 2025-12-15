-- ====== Предметная область: товары и параметры ======  
create table if not exists chem_class (  
                                          id_class int generated always as identity primary key,  
                                          short_name text not null unique,  
                                          name text not null,  
                                          main_class int null references chem_class(id_class)  
);  
  
create table if not exists prod (  
                                    id_prod text primary key,  
                                    name text not null,  
                                    id_class int not null references chem_class(id_class)  
);  
  
create table if not exists parametr (  
                                        id_par int generated always as identity primary key,  
                                        short_name text not null unique,  
                                        name text not null,  
                                        type_par text not null  
);  
  
create table if not exists par_class (  
                                         id_par int not null references parametr(id_par),  
                                         id_class int not null references chem_class(id_class),  
                                         min_val text null,  
                                         max_val text null,  
                                         primary key (id_par, id_class)  
);  
  
create table if not exists par_prod (  
                                        id_prod text not null references prod(id_prod),  
                                        id_par int not null references parametr(id_par),  
                                        val text null,  
                                        note text null,  
                                        primary key (id_prod, id_par)  
);  
  
-- ====== Справочники процессов ======  
create table if not exists type_state (  
                                          id_state int primary key,  
                                          name text not null,  
                                          sh_name text not null unique  
);  
  
create table if not exists type_decision (  
                                             id_dec int primary key,  
                                             name text not null,  
                                             sh_name text not null unique  
);  
  
create table if not exists type_process (  
                                            id_type_proc int primary key,  
                                            name text not null,  
                                            sh_name text not null unique,  
                                            id_class int null references chem_class(id_class),  
                                            base_process int null references type_process(id_type_proc),  
                                            n int null  
);  
  
-- ====== Логика переходов (создаём funct до state) ======  
create table if not exists funct (  
                                     id_f int primary key,  
                                     name text not null  
);  
  
-- Состояния в шаблоне процесса  
create table if not exists state (  
                                     id_type_pr int not null references type_process(id_type_proc),  
                                     id_state int not null references type_state(id_state),  
                                     flag_beg int not null default 0,  
                                     id_f int null references funct(id_f),  
                                     primary key (id_type_pr, id_state)  
);  
  
-- Допустимые решения в состоянии  
create table if not exists decision_map (  
                                            id_type_proc int not null,  
                                            id_state int not null,  
                                            id_dec int not null references type_decision(id_dec),  
                                            primary key (id_type_proc, id_state, id_dec),  
                                            foreign key (id_type_proc, id_state) references state(id_type_pr, id_state)  
);  
  
-- Группы пользователей и состав групп  
create table if not exists gr_person (  
                                         id_gr int primary key,  
                                         name text not null  
);  
  
create table if not exists person (  
                                      id_per int primary key,  
                                      fio text not null  
);  
  
create table if not exists consist_gr (  
                                          id_gr int not null references gr_person(id_gr),  
                                          id_per int not null references person(id_per),  
                                          primary key (id_gr, id_per)  
);  
  
-- Доступ групп к состояниям (в конкретном шаблоне)  
create table if not exists access_state (  
                                            id_gr int not null references gr_person(id_gr),  
                                            id_state int not null,  
                                            id_type_pr int not null,  
                                            primary key (id_gr, id_state, id_type_pr),  
                                            foreign key (id_type_pr, id_state) references state(id_type_pr, id_state)  
);  
  
-- ====== Исполнение процессов (экземпляры и траектория) ======  
create table if not exists process (  
                                       id_process int generated always as identity primary key,  
                                       name text not null,  
                                       sh_name text not null,  
                                       id_prod text not null references prod(id_prod),  
                                       type_pr int not null references type_process(id_type_proc)  
);  
  
create table if not exists trajctory (  
                                         id_process int not null references process(id_process) on delete cascade,  
                                         num_pos int not null,  
                                         id_state int not null references type_state(id_state),  
                                         id_dec int null references type_decision(id_dec),  
                                         id_per int null references person(id_per),  
                                         d_time timestamptz not null default now(),  
                                         primary key (id_process, num_pos)  
);  
  
-- ====== Логика переходов (предикаты и формулы) ======  
create table if not exists predicat (  
                                        id_pred int primary key,  
                                        id_state int null references type_state(id_state),  
                                        id_dec int null references type_decision(id_dec),  
                                        yes_par int null  
);  
  
create table if not exists formula (  
                                       id_f int not null references funct(id_f),  
                                       num_dis int not null,  
                                       num_con int not null,  
                                       id_pred int not null references predicat(id_pred),  
                                       primary key (id_f, num_dis, num_con, id_pred)  
);  
  
-- ============================================================  
-- ЧАСТЬ 2: ФУНКЦИИ (functions.sql)  
-- ============================================================  
  
-- 1) Добавление типового решения  
create or replace function ins_decision(p_name text, p_sh_name text)  
    returns table(id_dec int, o_res int)  
    language plpgsql  
as $$  
declare  
    v_new_id int;  
begin  
    if exists (select 1 from type_decision where sh_name = p_sh_name) then  
        return query            select (select td.id_dec from type_decision td where td.sh_name = p_sh_name limit 1), 0;  
        return;  
    end if;  
  
    select coalesce(max(td.id_dec), 0) + 1 into v_new_id from type_decision td;  
    insert into type_decision(id_dec, name, sh_name) values (v_new_id, p_name, p_sh_name);  
    return query select v_new_id, 1;  
end;  
$$;  
  
-- 2) Добавление типового состояния  
create or replace function ins_type_state(p_name text, p_sh_name text)  
    returns table(id_state int, o_res int)  
    language plpgsql  
as $$  
declare  
    v_new_id int;  
begin  
    if exists (select 1 from type_state where sh_name = p_sh_name) then  
        return query            select (select ts.id_state from type_state ts where ts.sh_name = p_sh_name limit 1), 0;  
        return;  
    end if;  
    select coalesce(max(ts.id_state), 0) + 1 into v_new_id from type_state ts;  
    insert into type_state(id_state, name, sh_name) values (v_new_id, p_name, p_sh_name);  
    return query select v_new_id, 1;  
end;  
$$;  
  
-- 3) Добавление типового процесса  
create or replace function ins_type_process(  
    p_name text,  
    p_sh_name text,  
    p_id_class int,  
    p_base_process int default null,  
    p_n int default null  
)  
    returns table(id_type_proc int, o_res int)  
    language plpgsql  
as $$  
declare  
    v_new_id int;  
begin  
    if exists (select 1 from type_process where sh_name = p_sh_name) then  
        return query            select (select tp.id_type_proc from type_process tp where tp.sh_name = p_sh_name limit 1), 0;  
        return;  
    end if;  
    select coalesce(max(tp.id_type_proc), 0) + 1 into v_new_id from type_process tp;  
    insert into type_process(id_type_proc, name, sh_name, id_class, base_process, n)  
    values (v_new_id, p_name, p_sh_name, p_id_class, p_base_process, p_n);  
    return query select v_new_id, 1;  
end;  
$$;  
  
-- 4) Добавление состояния в шаблон процесса  
create or replace function ins_state(  
    p_id_type_pr int,  
    p_id_state int,  
    p_flag_beg int default 0,  
    p_id_f int default null  
)  
    returns int  
    language plpgsql  
as $$  
begin  
    insert into state(id_type_pr, id_state, flag_beg, id_f)  
    values (p_id_type_pr, p_id_state, p_flag_beg, p_id_f)  
    on conflict (id_type_pr, id_state) do nothing;  
    return 1;  
end;  
$$;  
  
-- 5) Допустимое решение в состоянии  
create or replace function ins_decision_map(p_id_type_pr int, p_id_state int, p_id_dec int)  
    returns int  
    language plpgsql  
as $$  
begin  
    insert into decision_map(id_type_proc, id_state, id_dec)  
    values (p_id_type_pr, p_id_state, p_id_dec)  
    on conflict (id_type_proc, id_state, id_dec) do nothing;  
    return 1;  
end;  
$$;  
  
-- 6) Доступ группы к состоянию  
create or replace function ins_access_state(p_id_type_pr int, p_id_state int, p_id_gr int)  
    returns int  
    language plpgsql  
as $$  
begin  
    insert into access_state(id_type_pr, id_state, id_gr)  
    values (p_id_type_pr, p_id_state, p_id_gr)  
    on conflict (id_gr, id_state, id_type_pr) do nothing;  
    return 1;  
end;  
$$;  
  
-- 7) Создание процесса (экземпляра) для товара  
create or replace function ins_process(p_type_pr int, p_id_prod text, p_id_per int)  
    returns table(id_process int, o_res int)  
    language plpgsql  
as $$  
declare  
    v_id int;  
    v_initial_state int;  
begin  
    select s.id_state into v_initial_state  
    from state s  
    where s.id_type_pr = p_type_pr and s.flag_beg = 1  
    limit 1;  
    if v_initial_state is null then  
        raise exception 'No initial state for type_process=%', p_type_pr;  
    end if;  
  
    insert into process(name, sh_name, id_prod, type_pr)  
    values ('Процесс #' || p_type_pr || ' для ' || p_id_prod, p_type_pr::text, p_id_prod, p_type_pr)  
    returning process.id_process into v_id;  
  
    insert into trajctory(id_process, num_pos, id_state, id_dec, id_per)  
    values (v_id, 1, v_initial_state, null, p_id_per);  
  
    return query select v_id, 1;  
end;  
$$;  
  
-- 8) Чтение траектории процесса  
create or replace function read_trajectory(p_id_process int)  
    returns table(  
                     num_pos int,  
                     id_state int,  
                     state_name text,  
                     id_dec int,  
                     dec_name text,  
                     id_per int,  
                     fio text,  
                     d_time timestamptz  
                 )  
    language sql  
as $$  
select  
    t.num_pos,  
    t.id_state,  
    s.name as state_name,  
    t.id_dec,  
    d.name as dec_name,  
    t.id_per,  
    p.fio,  
    t.d_time  
from trajctory t  
         join type_state s on s.id_state = t.id_state  
         left join type_decision d on d.id_dec = t.id_dec  
         left join person p on p.id_per = t.id_per  
where t.id_process = p_id_process  
$$;  
