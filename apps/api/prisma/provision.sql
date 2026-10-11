-- Supabase SQL Editor (postgres)에서 실행합니다.
-- REPLACE_WITH_STRONG_PASSWORD를 직접 정한 비밀번호로 바꿉니다.
CREATE ROLE comit_api LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
-- Supabase의 postgres가 새 역할을 스키마 소유자로 지정할 수 있게 합니다.
GRANT comit_api TO postgres;
CREATE SCHEMA comit AUTHORIZATION comit_api;
REVOKE ALL ON SCHEMA comit FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA comit TO comit_api;
