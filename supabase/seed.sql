-- ==============================================================================
-- ComedKares Seed Data for Clinic Alpha & Clinic Beta
-- ==============================================================================

-- 1. Insert Clinics
INSERT INTO clinics (id, slug, name, theme_color, supported_languages, booking_policy, emergency_contact, is_active)
VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'clinic_alpha',
    'Sparsh Dental & Maxillofacial Clinic',
    '#4f46e5', -- Indigo
    ARRAY['en', 'hi', 'kn'],
    'Please arrive 10 minutes prior to your appointment time. Cancellations are free up to 2 hours in advance.',
    '+91 80 2345 6789',
    true
),
(
    'b0000000-0000-0000-0000-000000000002',
    'clinic_beta',
    'Sahyadri Ortho & Spine Center',
    '#059669', -- Emerald
    ARRAY['en', 'hi', 'kn'],
    'Please bring past X-rays or MRI reports if available. Consultations include preliminary mobility evaluation.',
    '+91 80 8765 4321',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    theme_color = EXCLUDED.theme_color,
    booking_policy = EXCLUDED.booking_policy;

-- 2. Insert Staff
INSERT INTO clinic_staff (id, user_id, clinic_id, full_name, role)
VALUES
(
    'a1111111-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Ramesh Hegde',
    'ADMIN'
),
(
    'a1111111-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Pooja Nair',
    'RECEPTIONIST'
),
(
    'b1111111-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000002',
    'Dr. Anand Patil',
    'ADMIN'
),
(
    'b1111111-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000002',
    'Kavitha Rao',
    'RECEPTIONIST'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Departments for Clinic Alpha
INSERT INTO departments (id, clinic_id, name, description)
VALUES
(
    'a2222222-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'General Dentistry & Hygiene',
    'Routine checkups, cleanings, tooth cavity fillings, and preventive dental care.'
),
(
    'a2222222-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Orthodontics & Braces',
    'Teeth alignment, metal braces, ceramic braces, and clear aligners.'
),
(
    'a2222222-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Oral & Maxillofacial Surgery',
    'Wisdom teeth extraction, dental implants, jaw alignment, and trauma management.'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Departments for Clinic Beta
INSERT INTO departments (id, clinic_id, name, description)
VALUES
(
    'b2222222-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'Joint Replacement & Arthroscopy',
    'Knee and hip replacement, arthroscopic repairs, cartilage treatments.'
),
(
    'b2222222-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'Spine Surgery & Scoliosis',
    'Herniated disc management, sciatica treatment, spinal decompression, endoscopic spine surgery.'
),
(
    'b2222222-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000002',
    'Sports Medicine & Physical Rehabilitation',
    'Ligament tear recovery (ACL/PCL), tennis elbow, rotator cuff therapies.'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Doctors for Clinic Alpha (Sparsh Dental)
INSERT INTO doctors (id, clinic_id, department_id, name, qualification, consultation_fee_inr, languages, is_active)
VALUES
(
    'a3333333-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'a2222222-0000-0000-0000-000000000001',
    'Dr. Priya Sharma',
    'BDS, MDS (Conservative Dentistry)',
    500.00,
    ARRAY['en', 'hi', 'kn'],
    true
),
(
    'a3333333-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'a2222222-0000-0000-0000-000000000002',
    'Dr. Vikram Kulkarni',
    'BDS, MDS (Orthodontics & Dentofacial Orthopedics)',
    700.00,
    ARRAY['en', 'hi', 'kn'],
    true
),
(
    'a3333333-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'a2222222-0000-0000-0000-000000000003',
    'Dr. Sandeep Narayan',
    'BDS, MDS, FIBOMS (Maxillofacial Surgery)',
    900.00,
    ARRAY['en', 'kn'],
    true
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Doctors for Clinic Beta (Sahyadri Ortho)
INSERT INTO doctors (id, clinic_id, department_id, name, qualification, consultation_fee_inr, languages, is_active)
VALUES
(
    'b3333333-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b2222222-0000-0000-0000-000000000001',
    'Dr. Rajeshwar Rao',
    'MBBS, MS (Ortho), MCh (Joint Reconstruction)',
    800.00,
    ARRAY['en', 'hi', 'kn'],
    true
),
(
    'b3333333-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'b2222222-0000-0000-0000-000000000002',
    'Dr. Ananya Deshmukh',
    'MBBS, MS (Ortho), FNB (Spine Surgery)',
    1000.00,
    ARRAY['en', 'hi', 'kn'],
    true
),
(
    'b3333333-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000002',
    'b2222222-0000-0000-0000-000000000003',
    'Dr. Harish Gowda',
    'MBBS, D.Ortho, Fellowship in Sports Medicine',
    650.00,
    ARRAY['en', 'kn'],
    true
)
ON CONFLICT (id) DO NOTHING;

-- 7. Helper DO block to populate 7 days of realistic slots
DO $$
DECLARE
    curr_day DATE := CURRENT_DATE;
    d_offset INT;
    slot_time TIMESTAMPTZ;
    clinic_a_id UUID := 'a0000000-0000-0000-0000-000000000001';
    clinic_b_id UUID := 'b0000000-0000-0000-0000-000000000002';
    doc_record RECORD;
    h INT;
BEGIN
    FOR d_offset IN 0..6 LOOP
        -- Morning slots (10:00, 11:00, 12:00) and Afternoon (15:00, 16:00, 17:00)
        FOR doc_record IN SELECT id, clinic_id FROM doctors WHERE is_active = true LOOP
            FOREACH h IN ARRAY ARRAY[10, 11, 12, 15, 16, 17] LOOP
                slot_time := (curr_day + d_offset) + (h || ' hours')::INTERVAL;
                
                -- Skip if past current time for today
                IF slot_time > NOW() THEN
                    INSERT INTO slots (clinic_id, doctor_id, start_time, end_time, status)
                    VALUES (
                        doc_record.clinic_id,
                        doc_record.id,
                        slot_time,
                        slot_time + INTERVAL '30 minutes',
                        'AVAILABLE'
                    )
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
