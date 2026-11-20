-- USUARIOS
INSERT INTO users (username, email, password, avatar_filename) VALUES
('ana', 'ana@test.com', '$2b$10$SCnMBQ5MrTuKFXgSny1mVuE1XZrzX72BpNvtLsINcCUsFGtRazokS', 'post1.jpg'),
('carlos', 'carlos@test.com', '$2b$10$SCnMBQ5MrTuKFXgSny1mVuE1XZrzX72BpNvtLsINcCUsFGtRazokS', 'post1.jpg'),
('lucia', 'lucia@test.com', '$2b$10$SCnMBQ5MrTuKFXgSny1mVuE1XZrzX72BpNvtLsINcCUsFGtRazokS', 'post1.jpg'),
('miguel', 'miguel@test.com', '$2b$10$SCnMBQ5MrTuKFXgSny1mVuE1XZrzX72BpNvtLsINcCUsFGtRazokS', 'post1.jpg')
ON CONFLICT DO NOTHING;

-- POSTS
INSERT INTO posts (user_id, caption, image_filename) VALUES
  ((SELECT id FROM users WHERE username = 'ana'),    'Atardecer en la playa',  'post1.jpg'),
  ((SELECT id FROM users WHERE username = 'ana'),    'Mi desayuno de hoy',     'post2.jpg'),
  ((SELECT id FROM users WHERE username = 'carlos'), 'Paseo por la montaña',   'post3.jpg'),
  ((SELECT id FROM users WHERE username = 'carlos'), 'Nuevo setup de trabajo', 'post4.jpg');

-- COMENTARIOS
INSERT INTO comments (post_id, user_id, comment) VALUES
  ((SELECT id FROM posts WHERE caption = 'Atardecer en la playa'),
   (SELECT id FROM users WHERE username = 'carlos'), '¡Qué vistas increíbles!'),
  ((SELECT id FROM posts WHERE caption = 'Atardecer en la playa'),
   (SELECT id FROM users WHERE username = 'lucia'),  'Me encanta esa foto'),
  ((SELECT id FROM posts WHERE caption = 'Paseo por la montaña'),
   (SELECT id FROM users WHERE username = 'ana'),    '¿Dónde es esto?'),
  ((SELECT id FROM posts WHERE caption = 'Mi desayuno de hoy'),
   (SELECT id FROM users WHERE username = 'miguel'), 'Tiene muy buena pinta');

-- LIKES
INSERT INTO likes (post_id, user_id) VALUES
  ((SELECT id FROM posts WHERE caption = 'Atardecer en la playa'),
   (SELECT id FROM users WHERE username = 'carlos')),
  ((SELECT id FROM posts WHERE caption = 'Atardecer en la playa'),
   (SELECT id FROM users WHERE username = 'lucia')),
  ((SELECT id FROM posts WHERE caption = 'Atardecer en la playa'),
   (SELECT id FROM users WHERE username = 'miguel')),
  ((SELECT id FROM posts WHERE caption = 'Paseo por la montaña'),
   (SELECT id FROM users WHERE username = 'ana')),
  ((SELECT id FROM posts WHERE caption = 'Nuevo setup de trabajo'),
   (SELECT id FROM users WHERE username = 'lucia'))
ON CONFLICT DO NOTHING;