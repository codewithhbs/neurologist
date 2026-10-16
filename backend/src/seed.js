/* eslint-disable no-console */
const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

const CLINIC_SLUG = 'neurocare-clinic-vasant-kunj';
const CONSULT_FEE = 1200;

const CLINIC_TIMING = {
  mon_sat: [['18:00', '20:00']],
  sun: []
};

const DOCTOR_WEEKLY = {
  mon: [['18:00', '20:00']],
  tue: [['18:00', '20:00']],
  wed: [['18:00', '20:00']],
  thu: [['18:00', '20:00']],
  fri: [['18:00', '20:00']],
  sat: [['18:00', '20:00']],
  sun: []
};

// TODO: replace with real clinic photos
const IMG_HERO_1 = '';
const IMG_HERO_2 = '';
const IMG_HERO_3 = '';

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Seeding started...');

    // ---------- ADMIN ----------
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@neurocareclinic.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await conn.query(
      `INSERT INTO admin_users (name, email, password, role) VALUES (?,?,?,'superadmin')
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['Super Admin', adminEmail, hashedPassword]
    );
    console.log(`✅ Admin user: ${adminEmail} / ${adminPassword}`);

    // ---------- CLINIC ----------
    await conn.query(
      `INSERT INTO clinics (name, slug, address, city, state, pincode, phone, appointment_number, whatsapp_number, email, timing_json, slot_duration_minutes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE address = VALUES(address), phone = VALUES(phone), appointment_number = VALUES(appointment_number),
         whatsapp_number = VALUES(whatsapp_number), email = VALUES(email), timing_json = VALUES(timing_json)`,
      [
        'Neurocare Clinic',
        CLINIC_SLUG,
        'Shop No. 2 (LSC B-1), Ground Floor, Pocket 1, Sector B, Near SBI ATM, Vasant Kunj, New Delhi – 110070',
        'New Delhi', 'Delhi', '110070',
        '7042564433', '7042564433', '7042564433',
        'neurocareclinic@gmail.com',
        JSON.stringify(CLINIC_TIMING),
        30
      ]
    );
    const [[clinicRow]] = await conn.query('SELECT id FROM clinics WHERE slug = ?', [CLINIC_SLUG]);
    const clinicId = clinicRow.id;
    console.log(`✅ Clinic seeded (id=${clinicId})`);

    // ---------- SERVICE CATEGORIES ----------
    const categories = [
      ['Brain & Seizure Disorders', 'brain-seizure-disorders'],
      ['Nerve & Muscle Disorders', 'nerve-muscle-disorders'],
      ['Movement & Memory Disorders', 'movement-memory-disorders'],
      ['Pain, Headache & Balance', 'pain-headache-balance']
    ];
    const categoryIds = {};
    for (const [name, slug] of categories) {
      await conn.query(
        `INSERT INTO service_categories (name, slug) VALUES (?,?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [name, slug]
      );
      const [[row]] = await conn.query('SELECT id FROM service_categories WHERE slug = ?', [slug]);
      categoryIds[slug] = row.id;
    }
    console.log('✅ Service categories seeded');

    // ---------- SERVICES (13 treatments) ----------
    const services = [
      {
        name: 'Epilepsy Treatment', slug: 'epilepsy-treatment', category: 'brain-seizure-disorders',
        short: 'Accurate diagnosis and long-term seizure control.',
        desc: '<p>Evaluation and management of epilepsy and seizure disorders, including medication planning, trigger identification and long-term follow-up to help you achieve better seizure control.</p>'
      },
      {
        name: 'Neurological Dysfunction', slug: 'neurological-dysfunction', category: 'brain-seizure-disorders',
        short: 'Assessment of weakness, numbness, imbalance and other nervous system issues.',
        desc: '<p>Detailed neurological assessment for symptoms such as weakness, numbness, tremors, imbalance or altered sensation, with a clear diagnosis and treatment plan.</p>'
      },
      {
        name: 'Neurological Problems', slug: 'neurological-problems', category: 'brain-seizure-disorders',
        short: 'Consultation for any brain, spine or nerve related concern.',
        desc: '<p>General neurology consultation for brain, spinal cord and nerve related complaints, including stroke follow-up and care.</p>'
      },
      {
        name: 'Demyelinating Disorders Treatment', slug: 'demyelinating-disorders-treatment', category: 'brain-seizure-disorders',
        short: 'Care for multiple sclerosis and related demyelinating conditions.',
        desc: '<p>Diagnosis and ongoing management of demyelinating disorders that affect the protective covering of nerves, with regular monitoring and treatment adjustments.</p>'
      },
      {
        name: 'Peripheral Nerve Treatment', slug: 'peripheral-nerve-treatment', category: 'nerve-muscle-disorders',
        short: 'Treatment for neuropathy and nerve damage.',
        desc: '<p>Evaluation and treatment of peripheral nerve disorders such as neuropathy causing tingling, burning, numbness or weakness in the hands and feet.</p>'
      },
      {
        name: 'Paralysis Treatment', slug: 'paralysis-treatment', category: 'nerve-muscle-disorders',
        short: 'Diagnosis and management of paralysis and weakness.',
        desc: '<p>Assessment and management of paralysis and sudden or progressive muscle weakness, including post-stroke care and rehabilitation guidance.</p>'
      },
      {
        name: 'Myasthenia Gravis Management', slug: 'myasthenia-gravis-management', category: 'nerve-muscle-disorders',
        short: 'Specialised care for muscle fatigue and drooping eyelids.',
        desc: '<p>Diagnosis and long-term management of myasthenia gravis, an autoimmune condition causing muscle weakness and fatigue, with individualised treatment plans.</p>'
      },
      {
        name: "Parkinson's Disease Treatment", slug: 'parkinsons-disease-treatment', category: 'movement-memory-disorders',
        short: 'Manage tremors, stiffness and slowness of movement.',
        desc: "<p>Comprehensive care for Parkinson's disease and other movement disorders, including medication optimisation and guidance to maintain independence and quality of life.</p>"
      },
      {
        name: 'Cognitive Disorder Treatment', slug: 'cognitive-disorder-treatment', category: 'movement-memory-disorders',
        short: 'Evaluation of memory loss and thinking problems.',
        desc: '<p>Assessment of memory issues, confusion and cognitive decline including dementia, with early diagnosis, treatment and caregiver guidance.</p>'
      },
      {
        name: 'Leg & Arm Pain Treatment', slug: 'leg-arm-pain-treatment', category: 'pain-headache-balance',
        short: 'Relief from nerve-related pain in the limbs.',
        desc: '<p>Diagnosis and treatment of radiating leg and arm pain, tingling and numbness caused by nerve compression or neuropathy.</p>'
      },
      {
        name: 'Neck & Back Pain Treatment', slug: 'neck-back-pain-treatment', category: 'pain-headache-balance',
        short: 'Find the cause of neck and back pain and treat it.',
        desc: '<p>Evaluation of chronic neck and back pain, including pinched nerves and disc-related problems, with a focus on non-surgical treatment and recovery.</p>'
      },
      {
        name: 'Giddiness & Vertigo Neurology', slug: 'giddiness-vertigo-neurology', category: 'pain-headache-balance',
        short: 'Treatment for dizziness, spinning sensation and imbalance.',
        desc: '<p>Evaluation of giddiness, vertigo and balance problems to identify neurological causes and provide effective treatment.</p>'
      },
      {
        name: 'Headache & Facial Pain Treatment', slug: 'headache-facial-pain-treatment', category: 'pain-headache-balance',
        short: 'Care for migraine, chronic headache and facial pain.',
        desc: '<p>Diagnosis and treatment of migraine, tension headache, cluster headache and facial pain conditions such as trigeminal neuralgia.</p>'
      }
    ];

    const serviceIds = {};
    let order = 1;
    for (const s of services) {
      await conn.query(
        `INSERT INTO services (category_id, name, slug, short_description, description, base_price, duration_minutes, is_featured, display_order)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE short_description = VALUES(short_description), description = VALUES(description), base_price = VALUES(base_price)`,
        [categoryIds[s.category], s.name, s.slug, s.short, s.desc, CONSULT_FEE, 30, 1, order++]
      );
      const [[row]] = await conn.query('SELECT id FROM services WHERE slug = ?', [s.slug]);
      serviceIds[s.slug] = row.id;
    }
    console.log(`✅ ${services.length} services seeded`);

    // ---------- DOCTOR ----------
    const doctor = {
      name: 'Dr. Neeraj Kumar',
      slug: 'dr-neeraj-kumar',
      qualification: 'MBBS, MD (General Medicine), DM (Neurology)',
      specialization: 'Senior Consultant Neurologist',
      experience: 24,
      rating: 5.0,
      bio: 'Dr. Neeraj Kumar is a Senior Consultant Neurologist with over 24 years of experience in healthcare and neurology. He completed his MBBS, MD in General Medicine, and DM in Neurology from Dr. RML Hospital, New Delhi. He treats migraine and headache, epilepsy, stroke, nerve disorders, Parkinson\'s disease, back pain, memory problems and dizziness. He is a member of the Indian Academy of Neurology and the American Academy of Neurology.'
    };

    await conn.query(
      `INSERT INTO doctors (name, slug, qualification, specialization, bio, experience_years, rating)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE qualification = VALUES(qualification), specialization = VALUES(specialization),
         bio = VALUES(bio), experience_years = VALUES(experience_years), rating = VALUES(rating)`,
      [doctor.name, doctor.slug, doctor.qualification, doctor.specialization, doctor.bio, doctor.experience, doctor.rating]
    );
    const [[doctorRow]] = await conn.query('SELECT id FROM doctors WHERE slug = ?', [doctor.slug]);
    const doctorId = doctorRow.id;

    await conn.query(
      `INSERT INTO doctor_clinics (doctor_id, clinic_id, weekly_availability)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE weekly_availability = VALUES(weekly_availability)`,
      [doctorId, clinicId, JSON.stringify(DOCTOR_WEEKLY)]
    );
    console.log('✅ Doctor seeded with clinic availability');

    // ---------- DOCTOR-SERVICE FEES ----------
    for (const s of services) {
      await conn.query(
        `INSERT INTO doctor_services (doctor_id, service_id, fee, duration_minutes)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE fee = VALUES(fee), duration_minutes = VALUES(duration_minutes)`,
        [doctorId, serviceIds[s.slug], CONSULT_FEE, 30]
      );
    }
    console.log('✅ Doctor-service fees seeded');

    // ---------- BLOG CATEGORIES & BLOGS ----------
    const blogCategories = [
      ['Neurology Care', 'neurology-care'],
      ['Headache & Migraine', 'headache-migraine'],
      ['Epilepsy & Stroke', 'epilepsy-stroke'],
      ['Spine & Nerve Health', 'spine-nerve-health']
    ];
    const blogCatIds = {};
    for (const [name, slug] of blogCategories) {
      await conn.query('INSERT INTO blog_categories (name, slug) VALUES (?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [name, slug]);
      const [[row]] = await conn.query('SELECT id FROM blog_categories WHERE slug = ?', [slug]);
      blogCatIds[slug] = row.id;
    }

    const blogs = [
      {
        title: 'When Should You See a Neurologist?', slug: 'when-should-you-see-a-neurologist',
        category: 'neurology-care',
        excerpt: 'Warning signs that mean it is time to consult a neurologist.',
        content: '<p>Persistent headaches, numbness, tingling, seizures, memory loss, dizziness or sudden weakness are signs that should not be ignored. Early consultation with a neurologist leads to faster diagnosis and better outcomes...</p>'
      },
      {
        title: 'Migraine vs Regular Headache: How to Tell the Difference', slug: 'migraine-vs-regular-headache',
        category: 'headache-migraine',
        excerpt: 'Understand the symptoms, triggers and treatment options for migraine.',
        content: '<p>Migraine is more than a headache. It often brings throbbing one-sided pain, nausea and sensitivity to light and sound. Identifying your triggers and getting the right treatment can greatly reduce attacks...</p>'
      },
      {
        title: 'Epilepsy: Myths, Facts and Treatment', slug: 'epilepsy-myths-facts-treatment',
        category: 'epilepsy-stroke',
        excerpt: 'Epilepsy is treatable. Learn the facts and what to do during a seizure.',
        content: '<p>With the right diagnosis and regular medication, most people with epilepsy live full and active lives. Understanding seizure first aid and sticking to treatment are key...</p>'
      },
      {
        title: 'Stroke Warning Signs: Act FAST', slug: 'stroke-warning-signs-act-fast',
        category: 'epilepsy-stroke',
        excerpt: 'Recognise the early signs of stroke and why every minute counts.',
        content: '<p>Face drooping, arm weakness and speech difficulty are classic signs of stroke. Reaching a hospital quickly can save brain function and lives...</p>'
      },
      {
        title: 'Back Pain and Pinched Nerves: Causes and Relief', slug: 'back-pain-pinched-nerves-causes-relief',
        category: 'spine-nerve-health',
        excerpt: 'Why back pain sometimes radiates to the legs and how it is treated.',
        content: '<p>Pain that travels down the leg, with tingling or numbness, often points to nerve compression. Most cases improve with medication, posture correction and physiotherapy...</p>'
      },
      {
        title: 'Memory Loss: Normal Ageing or Something More?', slug: 'memory-loss-normal-ageing-or-something-more',
        category: 'neurology-care',
        excerpt: 'Know when forgetfulness needs medical attention.',
        content: '<p>Occasional forgetfulness is normal, but repeated memory lapses, confusion and difficulty with daily tasks may indicate a cognitive disorder. Early evaluation helps slow progression...</p>'
      }
    ];

    for (const b of blogs) {
      await conn.query(
        `INSERT INTO blogs (category_id, title, slug, excerpt, content, author_name, is_published, published_at)
         VALUES (?,?,?,?,?,?,1,NOW())
         ON DUPLICATE KEY UPDATE excerpt = VALUES(excerpt), content = VALUES(content)`,
        [blogCatIds[b.category], b.title, b.slug, b.excerpt, b.content, doctor.name]
      );
    }
    console.log(`✅ ${blogs.length} blogs seeded`);

    // ---------- SITE SETTINGS ----------
    const settings = [
      ['site_name', 'Neurocare Clinic', 'text'],
      ['site_tagline', 'Expert Neurology Care in Vasant Kunj', 'text'],
      ['phone', '7042564433', 'text'],
      ['whatsapp', '917042564433', 'text'],
      ['email', 'neurocareclinic@gmail.com', 'text'],
      ['address', 'Shop No. 2 (LSC B-1), Ground Floor, Pocket 1, Sector B, Near SBI ATM, Vasant Kunj, New Delhi – 110070', 'text'],
      ['logo_url', '', 'text'],
      ['years_experience', '24+', 'text'],
      ['google_rating', '5.0', 'text'],
      ['google_reviews_count', '13', 'text'],
      ['latitude', '28.522594952899', 'text'],
      ['longitude', '77.159592211246', 'text'],
      ['google_maps_url', 'https://maps.app.goo.gl/qpJNYKBd39XqGJ9a7', 'text'],
      ['clinic_timing_text', 'Mon – Sat: 6:00 PM – 8:00 PM | Sunday: Closed', 'text'],
      ['consultation_fee', String(CONSULT_FEE), 'text'],
      ['social_links', JSON.stringify({
        facebook: 'https://www.facebook.com/people/Neurocare-clinic/61561380222927/',
        instagram: 'https://www.instagram.com/neurocare_clinic_/',
        google: 'https://maps.app.goo.gl/qpJNYKBd39XqGJ9a7',
        linkedin: ''
      }), 'json']
    ];
    for (const [key, value, type] of settings) {
      await conn.query(
        `INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value, type]
      );
    }
    console.log('✅ Site settings seeded');

    // ---------- HERO BANNERS ----------
    const [[bannerCount]] = await conn.query('SELECT COUNT(*) AS count FROM hero_banners');
    if (bannerCount.count === 0) {
      const banners = [
        ['Expert Neurology Care for Brain, Nerve & Spine', 'Consult Dr. Neeraj Kumar, Senior Consultant Neurologist with 24+ years of experience.', IMG_HERO_1, 'Book Appointment', '/appointment', 1],
        ['Migraine, Epilepsy, Stroke & Parkinson\'s Care', 'Accurate diagnosis and personalised treatment plans for every neurological condition.', IMG_HERO_2, 'View Treatments', '/services', 2],
        ['Dizziness, Memory Loss or Back Pain?', 'Get to the root cause with a detailed neurological evaluation in Vasant Kunj.', IMG_HERO_3, 'Consult Now', '/appointment', 3]
      ];
      for (const [title, subtitle, image_url, cta_text, cta_link, display_order] of banners) {
        await conn.query(
          `INSERT INTO hero_banners (title, subtitle, image_url, cta_text, cta_link, display_order) VALUES (?,?,?,?,?,?)`,
          [title, subtitle, image_url, cta_text, cta_link, display_order]
        );
      }
      console.log(`✅ ${banners.length} hero banners seeded`);
    } else {
      console.log('✅ Hero banners already present, skipping');
    }

    // ---------- ONBOARDING SLIDES (mobile app) ----------
    const [[slideCount]] = await conn.query('SELECT COUNT(*) AS count FROM onboarding_slides');
    if (slideCount.count === 0) {
      const slides = [
        ['Expert Neurology Care', 'Consult a senior neurologist for brain, nerve and spine conditions.', IMG_HERO_1, 1],
        ['Book Appointments Instantly', 'Pick a slot between 6 PM and 8 PM and confirm in seconds.', IMG_HERO_2, 2],
        ['Track Your Treatment', 'View prescriptions, reports and follow-ups anytime, anywhere.', IMG_HERO_3, 3]
      ];
      for (const [title, subtitle, image_url, display_order] of slides) {
        await conn.query(
          `INSERT INTO onboarding_slides (title, subtitle, image_url, display_order) VALUES (?,?,?,?)`,
          [title, subtitle, image_url, display_order]
        );
      }
      console.log(`✅ ${slides.length} onboarding slides seeded`);
    } else {
      console.log('✅ Onboarding slides already present, skipping');
    }

    // ---------- SAMPLE PATIENT (for testing) ----------
    await conn.query(
      `INSERT INTO patients (name, mobile, email) VALUES ('Test Patient', '9999999999', 'test@example.com')
       ON DUPLICATE KEY UPDATE name = VALUES(name)`
    );
    console.log('✅ Test patient seeded (mobile: 9999999999, use OTP_PROVIDER=console to see OTP in server logs)');

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

seed();