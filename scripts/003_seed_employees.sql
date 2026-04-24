INSERT INTO employees (full_name, email, phone, origin_country, location, factory, role, department, start_date, hourly_rate, effective_date, status, birth_date, passport, issuing_country, residence_state, city, address, zip_code, language)
VALUES
  ('Carlos Eduardo Silva', 'carlos.silva@empresa.com', '+1 (555) 123-4567', 'Brasil', 'Austin, TX', 'Tesla Gigafactory', 'Soldador', 'Producao', '2024-01-15', 28.50, '2024-01-15', 'Ativo', '1990-05-12', 'BR123456', 'Brasil', 'TX', 'Austin', '1234 Main St', '73301', 'pt'),
  ('Maria Santos', 'maria.santos@empresa.com', '+1 (555) 234-5678', 'Brasil', 'Houston, TX', 'Shell Refinery', 'Eletricista', 'Manutencao', '2023-06-01', 32.00, '2024-01-01', 'Ativo', '1988-11-23', 'BR789012', 'Brasil', 'TX', 'Houston', '5678 Oak Ave', '77001', 'pt'),
  ('Joao Oliveira', 'joao.oliveira@empresa.com', '+1 (555) 345-6789', 'Brasil', 'Dallas, TX', 'Toyota Plant', 'Montador', 'Producao', '2024-03-01', 25.00, '2024-03-01', 'Ativo', '1995-03-08', 'BR345678', 'Brasil', 'TX', 'Dallas', '9012 Pine Rd', '75201', 'pt'),
  ('Ana Pereira', 'ana.pereira@empresa.com', '+1 (555) 456-7890', 'Brasil', 'Austin, TX', 'Samsung Fab', 'Tecnica de Qualidade', 'Qualidade', '2023-09-15', 30.00, '2024-01-01', 'Ativo', '1992-07-19', 'BR901234', 'Brasil', 'TX', 'Austin', '3456 Elm St', '73301', 'pt'),
  ('Pedro Fernandes', 'pedro.fernandes@empresa.com', '+1 (555) 567-8901', 'Brasil', 'San Antonio, TX', 'Boeing Factory', 'Mecanico', 'Manutencao', '2024-02-01', 27.50, '2024-02-01', 'Inativo', '1987-12-30', 'BR567890', 'Brasil', 'TX', 'San Antonio', '7890 Cedar Ln', '78201', 'pt')
ON CONFLICT DO NOTHING;

-- Seed some time entries for the last 7 days
INSERT INTO time_entries (employee_id, date, clock_in, clock_out, break_time, total_hours, status, project)
SELECT
  e.id,
  CURRENT_DATE - (d.day_offset || ' days')::interval,
  '07:00'::time,
  '16:00'::time,
  1.0,
  8.0,
  'active',
  e.factory
FROM employees e
CROSS JOIN (SELECT generate_series(0, 4) AS day_offset) d
WHERE e.status = 'Ativo'
  AND (CURRENT_DATE - (d.day_offset || ' days')::interval)::date >= CURRENT_DATE - interval '7 days'
ON CONFLICT DO NOTHING;
