export const metadata = { title: 'Terms & Conditions', robots: { index: false } };

export default function Terms() {
  return (
    <section className="container-x py-16 max-w-3xl">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Terms & Conditions
            </h1>

            <p className="text-sm text-slate-500">
              Neurocare Clinic
            </p>

            <p className="text-sm text-slate-500">
              Effective Date:{' '}
              <span className="font-medium text-slate-700">August 25, 2026</span>
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Intro */}
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <p className="text-base leading-7 text-slate-600">
            These Terms & Conditions ("Terms") govern your access to and use of the
            website, mobile application, appointment booking services, and related
            services (collectively, the "Services") provided by Neurocare Clinic | Dr Neeraj Kumar ("Neurocare Clinic", "we", "us", or "our").
          </p>

          <p className="mt-4 text-base leading-7 text-slate-600">
            By accessing our website, booking an appointment, or otherwise using our
            Services, you agree to be bound by these Terms. If you do not agree with
            any part of these Terms, please do not use our Services.
          </p>

        </section>


        {/* 1 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            1. Eligibility and Accounts
          </h2>

          <p className="mt-4 leading-7">
            You must provide accurate, current, and complete information when booking
            an appointment or otherwise using our Services.
          </p>

          <p className="mt-4 leading-7">
            If you are booking on behalf of a minor or another individual, you confirm
            that you are authorized to do so and to provide their information for the
            purpose of scheduling and delivering neurological care.
          </p>

          <p className="mt-4 leading-7">
            You are responsible for maintaining the confidentiality of any login
            credentials or account access associated with our Services and for all
            activity that occurs under your account.
          </p>

        </section>


        {/* 2 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            2. Appointments
          </h2>

          <p className="mt-4 leading-7">
            Appointment requests made through our website or application are subject
            to doctor availability and confirmation by our clinic staff. A submitted
            request does not guarantee a specific date or time until confirmed.
          </p>

          <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
            <li>Please arrive on time; late arrivals may result in a shortened consultation or rescheduling.</li>
            <li>We recommend arriving a few minutes early to complete any necessary paperwork.</li>
            <li>Appointment reminders and confirmations may be sent by call, SMS, WhatsApp, or email.</li>
            <li>We reserve the right to reschedule appointments due to doctor unavailability, emergencies, or unforeseen circumstances, and will make reasonable efforts to notify you in advance.</li>
          </ul>

        </section>


        {/* 3 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            3. Cancellations and Rescheduling
          </h2>

          <p className="mt-4 leading-7">
            You may cancel or reschedule an appointment by contacting us using the
            details in the Contact section below. We appreciate advance notice
            wherever possible so that the slot can be offered to another patient.
          </p>

          <p className="mt-4 leading-7">
            Repeated no-shows or last-minute cancellations may affect your ability
            to book future appointments online.
          </p>

        </section>


        {/* 4 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            4. Payments
          </h2>

          <p className="mt-4 leading-7">
            Where online payment is available, payments are processed securely through
            our third-party payment provider, Razorpay. We do not store your full
            payment card, UPI, or banking credentials on our systems; these are
            handled directly by the payment provider in accordance with its own
            security practices and policies.
          </p>

          <p className="mt-4 leading-7">
            Treatment costs, consultation fees, and any additional charges will be
            communicated to you prior to or at the time of treatment, where practical.
            Final costs may vary based on the diagnosis, treatment plan, and any
            procedures carried out during your visit.
          </p>

          <p className="mt-4 leading-7">
            Refunds for cancelled paid appointments will be processed in accordance
            with our clinic's refund policy, which may take into account the timing
            of the cancellation and any costs already incurred. Please contact us to
            request a refund or clarify the applicable timelines.
          </p>

        </section>


        {/* 5 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            5. Medical Care
          </h2>

          <p className="mt-4 leading-7">
            Information provided through our website or application, including any
            educational content, is intended for general informational purposes only
            and does not constitute professional medical advice.
          </p>

          <p className="mt-4 leading-7">
            Diagnosis and treatment recommendations can only be made following an
            in-person consultation and examination by a qualified doctor or clinician.
          </p>

          <p className="mt-4 leading-7">
            You are responsible for providing complete and accurate information about
            your medical history to help ensure safe and appropriate
            treatment. Outcomes of treatment can vary between individuals, and
            we make no guarantee regarding specific treatment results.
          </p>

        </section>


        {/* 6 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            6. User Conduct
          </h2>

          <p className="mt-4 leading-7">
            When using our Services, you agree not to:
          </p>

          <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
            <li>Provide false, misleading, or incomplete information when booking an appointment</li>
            <li>Use the website or application for any unlawful, fraudulent, or abusive purpose</li>
            <li>Attempt to gain unauthorized access to our systems, other users' data, or clinic records</li>
            <li>Interfere with or disrupt the operation or security of our website or application</li>
            <li>Upload or transmit any content that is harmful, offensive, or infringes on the rights of others</li>
          </ul>

          <p className="mt-4 leading-7">
            We reserve the right to suspend or restrict access to our Services for
            any user who violates these Terms.
          </p>

        </section>


        {/* 7 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            7. Intellectual Property
          </h2>

          <p className="mt-4 leading-7">
            All content on our website and application, including text, graphics,
            logos, images, and software, is the property of Neurocare Clinic or its licensors and is protected by applicable
            intellectual property laws.
          </p>

          <p className="mt-4 leading-7">
            You may not copy, reproduce, distribute, modify, or create derivative
            works from any part of our Services without our prior written consent,
            except as necessary for your personal, non-commercial use of the Services.
          </p>

        </section>


        {/* 8 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            8. Third-Party Services and Links
          </h2>

          <p className="mt-4 leading-7">
            Our website or application may contain links to, or integrate with,
            third-party services such as payment providers, maps, or communication
            platforms. These third parties operate under their own terms and privacy
            policies, and we are not responsible for their content or practices.
          </p>

        </section>


        {/* 9 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            9. Limitation of Liability
          </h2>

          <p className="mt-4 leading-7">
            To the fullest extent permitted by applicable law, Neurocare Clinic shall not be liable for any indirect, incidental,
            consequential, or special damages arising out of or in connection with
            your use of our website, application, or booking Services.
          </p>

          <p className="mt-4 leading-7">
            Nothing in these Terms is intended to limit liability for matters that
            cannot be excluded or limited under applicable law, including liability
            arising from clinical negligence in the provision of medical treatment,
            which is governed separately by applicable healthcare regulations and
            professional standards.
          </p>

        </section>


        {/* 10 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            10. Indemnification
          </h2>

          <p className="mt-4 leading-7">
            You agree to indemnify and hold Neurocare Clinic, its
            staff, and affiliates harmless from any claims, damages, losses, or
            expenses arising from your misuse of the Services or your violation of
            these Terms, except to the extent caused by our own negligence or
            wrongdoing.
          </p>

        </section>


        {/* 11 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            11. Availability of Services
          </h2>

          <p className="mt-4 leading-7">
            We aim to keep our website and application available and functioning
            correctly, but we do not guarantee uninterrupted or error-free access.
            We may suspend, restrict, or modify any part of our Services for
            maintenance, updates, or reasons beyond our reasonable control.
          </p>

        </section>


        {/* 12 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            12. Privacy
          </h2>

          <p className="mt-4 leading-7">
            Your use of our Services is also governed by our Privacy Policy, which
            explains how we collect, use, and protect your personal and health
            information. Please review the Privacy Policy to understand our practices.
          </p>

        </section>


        {/* 13 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            13. Changes to These Terms
          </h2>

          <p className="mt-4 leading-7">
            We may update these Terms from time to time to reflect changes in our
            Services, legal requirements, or business practices. When we make
            changes, we will update the "Effective Date" shown at the top of this
            page.
          </p>

          <p className="mt-4 leading-7">
            Continued use of our Services after any changes take effect constitutes
            your acceptance of the revised Terms.
          </p>

        </section>


        {/* 14 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            14. Governing Law
          </h2>

          <p className="mt-4 leading-7">
            These Terms shall be governed by and construed in accordance with
            applicable local laws, without regard to conflict-of-law principles.
            Any disputes arising out of or relating to these Terms or the Services
            shall be subject to the jurisdiction of the competent courts serving our
            clinic's location.
          </p>

        </section>


        {/* 15 Contact */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            15. Contact Us
          </h2>

          <p className="mt-4 leading-7">
            If you have questions or concerns about these Terms, please contact us:
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-bold text-slate-900">
              Neurocare Clinic
            </h3>

            <div className="mt-4 space-y-3 text-sm sm:text-base">

              <p>
                <span className="font-semibold text-slate-900">Phone:</span>
                <a
                  href="tel:+917042564433"
                  className="ml-1 text-brand-600 hover:text-brand-700 hover:underline"
                >
                  7042564433
                </a>
              </p>

              <p>
                <span className="font-semibold text-slate-900">Email:</span>
                <a
                  href="mailto:neurocareclinic@gmail.com"
                  className="ml-1 text-brand-600 hover:text-brand-700 hover:underline"
                >
                  neurocareclinic@gmail.com
                </a>
              </p>

              <p>
                <span className="font-semibold text-slate-900">Address:</span>
                <span className="ml-1">
                  Shop No. 2 (LSC B-1), Ground Floor, Pocket 1, Sector B, Near SBI ATM, Vasant Kunj, New Delhi – 110070
                </span>
              </p>

            </div>

          </div>

        </section>


        {/* 16 */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-slate-900">
            16. Acknowledgment
          </h2>

          <p className="mt-4 leading-7">
            By booking an appointment or using this website or application, you
            acknowledge that you have read, understood, and agree to be bound by
            these Terms & Conditions.
          </p>

        </section>


        {/* Footer Notice */}
        <section className="mt-12 rounded-2xl border border-brand-100 bg-brand-50 p-6">

          <p className="text-sm leading-6 text-blue-900">
            <span className="font-semibold">Last Updated:</span>{' '}
            August 25, 2026
          </p>

          <p className="mt-2 text-sm leading-6 text-brand-800">
            These Terms & Conditions apply to the Neurocare Clinic
            website, mobile application, appointment booking services, and related
            Services.
          </p>

        </section>

      </main>


      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">

          <p>
            © 2026 Neurocare Clinic. All rights reserved.
          </p>

        </div>
      </footer>
    </section>
  );
}