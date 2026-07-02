INSERT INTO cms_users (id, email, role, name, password_hash, created_at)
VALUES ('cms-owner-14a5e7aa8bf037b0', 'owner@slaquatics.local', 'owner', 'Local CMS Owner', 'pbkdf2-sha256$210000$T1y847Uv+TG7TcbjkHW/Ww==$t2VS6e/b1goZrlbDsx2UU2/ruZNMZ9+wWTERmIBfrl8=', '2026-07-02T01:05:35.975Z')
ON CONFLICT(email) DO UPDATE SET role = excluded.role, name = excluded.name, password_hash = excluded.password_hash;
