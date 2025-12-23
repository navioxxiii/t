import { Metadata } from "next";
import { branding } from "@/config/branding";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Crypto Wallet services",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Content */}
      <main className="container mx-auto px-4 py-20 md:py-28 max-w-4xl">
        <div className="bg-bg-secondary rounded-lg border border-border p-6 md:p-8 lg:p-12">
          {/* Title Section */}
          <div className="mb-8 pb-8 border-b border-border">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {branding.name.full} Terms and Conditions
            </h1>
            <p className="text-text-secondary text-sm">
              Last Updated: November 23, 2024
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-invert max-w-none space-y-8">
            <p className="text-text-primary leading-relaxed">
              <strong className="text-brand-primary">
                {branding.name.legal}
              </strong>{" "}
              (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), offers
              its cryptocurrency wallet services through our website at{" "}
              <strong>{branding.company.website}</strong>. We also have
              associated mobile apps and products (collectively,
              &ldquo;Services&rdquo; or &ldquo;{branding.name.full}&rdquo;).
              Before using our Services, it&apos;s important to carefully read
              our Terms of Service (the &ldquo;Terms&rdquo;) and any other
              policies or notices related to our website or mobile apps.
            </p>

            {/* Agreement to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Agreement to Terms
              </h2>
              <p className="text-text-primary leading-relaxed mb-4">
                By using any of our Services, you confirm that (i) you have read
                and understand our Terms, (ii) you agree to follow these Terms,
                and (iii) you are legally allowed to accept these Terms. If you
                don&apos;t agree with these Terms or any changes we make to
                them, please don&apos;t use our Services.
              </p>
              <p className="text-text-primary leading-relaxed">
                Please note,{" "}
                <strong className="text-brand-primary">
                  WE DO NOT OFFER FINANCIAL OR INVESTMENT ADVICE. WE PROVIDE
                  TECHNOLOGY SERVICES, WITHOUT MAKING ANY RECOMMENDATIONS ABOUT
                  DIGITAL ASSET TRANSACTIONS OR OPERATIONS
                </strong>
                . Remember, any decision to perform transactions with digital
                assets should be decided by you.
              </p>
            </section>

            {/* Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Privacy Policy
              </h2>
              <p className="text-text-primary leading-relaxed">
                To understand how we collect, use and disclose our users&apos;
                information, please check our Privacy Policy. By using our
                Services, you accept and agree that we will manage your
                information (including any personal data you give us) following
                the terms in our Privacy Policy.
              </p>
            </section>

            {/* Updates to Terms or Service */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Updates to Terms or Service
              </h2>
              <p className="text-text-primary leading-relaxed mb-4">
                We reserve the right to update or modify these Terms at any time
                at our sole discretion. If we do so, we&apos;ll let you know by
                either posting the revised Terms on our website, on our mobile
                application or through other methods of communication which we
                deem reasonable. Such revised Terms as posted will take effect
                immediately, unless otherwise indicated.
              </p>
              <p className="text-text-primary leading-relaxed mb-4">
                You should regularly check our website to inform yourself of any
                such changes and decide whether or not to accept the revised
                version of these Terms. If you continue to use{" "}
                {branding.name.full} following any update or modification of the
                Terms you shall be deemed to have accepted the revised Terms. If
                you do not agree to the Terms or any update or modification to
                the Terms, you must cease to access or use our Services.
              </p>
              <p className="text-text-primary leading-relaxed">
                Our Services are evolving over time, we may change or
                discontinue all or any part of the Services, at any time and
                without prior notice, and at our sole discretion.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Eligibility
              </h2>
              <p className="text-text-primary leading-relaxed mb-4">
                To be eligible to use {branding.name.full}:
              </p>
              <ul className="list-disc list-inside space-y-3 text-text-primary ml-4">
                <li>
                  You must be at least eighteen (18) years old and legally
                  competent to enter into these Terms.
                </li>
                <li>
                  If you are using our Services on behalf of a legal entity, you
                  further represent and warrant that the legal entity is duly
                  organized and validly existing under the applicable laws of
                  the jurisdiction of its organization; and you are duly
                  authorized by such legal entity to act on its behalf.
                </li>
                <li>
                  You must not be located in, or a resident, national, or entity
                  established under the laws of any jurisdiction that is
                  comprehensively sanctioned by the U.S., including but not
                  limited to Cuba, Iran, North Korea, Syria, and the Crimea,
                  Donetsk, and Luhansk regions of Ukraine.
                </li>
                <li>
                  You must not be currently on any list of prohibited or
                  restricted persons maintained by the U.S. government
                  (including the U.S. Treasury Department&apos;s Office of
                  Foreign Assets Control (&ldquo;OFAC&rdquo;) Specially
                  Designated Nationals and Blocked Persons List and Foreign
                  Sanctions Evaders List and the U.S. Department of
                  Commerce&apos;s Bureau of Industry and Security
                  (&ldquo;BIS&rdquo;) Entity List), the United Nations Security
                  Council, the United Kingdom government, the European Union or
                  its member states, or any other relevant sanctions authority.
                </li>
                <li>
                  You can only use our Services if permitted under the laws of
                  your jurisdiction. For the avoidance of doubt, you may not use
                  our Services if you are located in, or a citizen or resident
                  of any state, country, territory or other jurisdiction where
                  your use of our Services would be illegal or otherwise violate
                  any applicable laws.
                </li>
              </ul>
              <p className="text-text-primary leading-relaxed mt-4 mb-4">
                Please make sure that these Terms are in compliance with all
                laws, rules, and regulations that apply to you. You agree that
                you are only using our Services with legally-obtained funds that
                rightfully belong to you. By using {branding.name.full}, you
                represent and warrant that you meet all eligibility requirements
                that we outline in these Terms.
              </p>
              <p className="text-text-primary leading-relaxed">
                Notwithstanding the aforementioned conditions, we maintain
                absolute discretion to prohibit certain individuals from
                accessing or utilizing {branding.name.full}. Additionally,
                please note that we reserve the right to modify our eligibility
                criteria at any given time, in accordance with relevant laws,
                regulations, and company policies.
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Services
              </h2>
              <p className="text-text-primary leading-relaxed mb-4">
                {branding.name.full} serves as a centralized digital wallet
                platform for digital assets such as cryptocurrencies, virtual
                commodities, and NFTs (&ldquo;Digital Assets&rdquo;). We provide
                secure custody and management of your digital assets.{" "}
                {branding.name.full} equips you to:
              </p>
              <ul className="list-disc list-inside space-y-3 text-text-primary ml-4">
                <li>
                  Create and manage wallet accounts secured by industry-standard
                  encryption;
                </li>
                <li>
                  Send and receive various digital assets to and from other
                  wallet addresses;
                </li>
                <li>
                  Conduct swaps or trade digital assets utilizing features
                  provided by independent third-party service providers
                  integrated within our platform;
                </li>
                <li>
                  Stake specific digital assets through our integrated staking
                  services to earn rewards;
                </li>
                <li>
                  Participate in copy trading by following and automatically
                  replicating trades from experienced traders;
                </li>
                <li>
                  Earn yield on your digital assets through our vault products
                  with competitive APY rates;
                </li>
                <li>
                  Gain access to digital asset price information and market data
                  provided by independent third-party service providers; and
                </li>
                <li>
                  View transaction history and manage your account settings
                  through our web and mobile applications.
                </li>
              </ul>
              <p className="text-text-primary leading-relaxed mt-4">
                Please remember that your usage of {branding.name.full}&apos;s
                features and services underpins your acceptance of the risks
                associated with digital asset management and transaction
                activities, including network variability, cybersecurity
                threats, and market volatility.
              </p>
            </section>

            {/* Account Registration and Security */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Account Registration and Security
              </h2>
              <p className="text-text-primary leading-relaxed mb-4">
                To utilize {branding.name.full}, you will need to create an
                account by providing accurate and complete registration
                information. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-3 text-text-primary ml-4">
                <li>
                  Maintaining the confidentiality of your account credentials,
                  including your password and any two-factor authentication
                  methods;
                </li>
                <li>
                  All activities that occur under your account, whether
                  authorized by you or not;
                </li>
                <li>
                  Immediately notifying us of any unauthorized access or
                  security breaches;
                </li>
                <li>
                  Ensuring your contact information remains current and
                  accurate;
                </li>
                <li>
                  Complying with any identity verification (KYC) requirements we
                  may implement.
                </li>
              </ul>
              <p className="text-text-primary leading-relaxed mt-4">
                We hold no liability for activities on your account, whether
                they are authorized by you or not. To enhance security, we
                strongly advise implementing two-factor authentication, using
                strong and unique passwords, and regularly monitoring your
                account activity.
              </p>
            </section>

            {/* Custody and Control */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Custody and Control
              </h2>
              <p className="text-text-primary leading-relaxed mb-4">
                <strong className="text-brand-primary">
                  As a centralized wallet service, {branding.name.full}{" "}
                  maintains custody of your private keys and digital assets on
                  your behalf.
                </strong>{" "}
                This means:
              </p>
              <ul className="list-disc list-inside space-y-3 text-text-primary ml-4">
                <li>
                  We control the private keys associated with your wallet
                  addresses;
                </li>
                <li>
                  Your digital assets are held in our custody and secured using
                  industry-standard security measures;
                </li>
                <li>
                  We are responsible for securing your assets against
                  unauthorized access and theft;
                </li>
                <li>
                  You access and manage your assets through your account
                  credentials;
                </li>
                <li>
                  We may implement withdrawal limits, security checks, and other
                  protective measures.
                </li>
              </ul>
              <p className="text-text-primary leading-relaxed mt-4">
                While we employ robust security measures to protect your assets,
                you acknowledge that no system is entirely foolproof. You should
                maintain awareness of the inherent risks associated with digital
                asset custody and take appropriate precautions with your account
                security.
              </p>
            </section>

            {/* Indemnity */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Indemnity
              </h2>
              <p className="text-text-primary leading-relaxed">
                To the extent permitted by applicable law, you agree to defend,
                indemnify, and hold harmless us, our affiliates, and our
                respective shareholders, members, directors, officers,
                employees, attorneys, agents, representatives, suppliers and
                contractors, from and against any and all claims, damages,
                obligations, losses, liabilities, costs or debt, and expenses
                (including, but not limited to, attorney&apos;s fees) arising
                from: (a) your use of and access to the Services; (b) any
                feedback or submissions you provide to us concerning{" "}
                {branding.name.full}; (c) your violation of the Terms; or (d)
                your violation of any law, rule, or regulation, or the rights of
                any third party.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Termination
              </h2>
              <p className="text-text-primary leading-relaxed mb-4">
                In the event of termination concerning your license to use{" "}
                {branding.name.full}, your obligations under this Agreement will
                still continue. We may, in our sole discretion and without cost
                to you, with or without prior notice, and at any time, modify or
                discontinue, temporarily or permanently, any portion of our
                Services.
              </p>
              <p className="text-text-primary leading-relaxed">
                You are solely responsible for securing access to your account
                information and funds. If we discontinue all or any part of the
                Services, we shall not be held responsible or liable for any
                loss of access to your account or any Digital Assets.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Governing Law and Dispute Resolution
              </h2>
              <p className="text-text-primary leading-relaxed mb-4">
                These Terms, and your use of the Services, shall be governed by
                and construed in accordance with the laws applicable in your
                jurisdiction, without regard to conflict of law provisions. Any
                dispute arising from or relating to the subject matter of these
                Terms shall be finally settled by arbitration in accordance with
                the applicable arbitration rules, with the place of arbitration
                being determined by mutual agreement.
              </p>
              <p className="text-text-primary leading-relaxed">
                You and {branding.name.full} agree that any dispute must be
                brought in the parties&apos; individual capacity and not as a
                plaintiff or class member in any purported class or
                representative proceeding.
              </p>
            </section>

            {/* Limitation on Claims */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                The Limitation on Claims
              </h2>
              <p className="text-text-primary leading-relaxed">
                You agree that any claim you may have arising out of or related
                to your relationship with us must be filed within one year after
                such claim arises, otherwise, your claim is permanently barred.
              </p>
            </section>

            {/* Disclaimer and Liability */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Limitation of Liability & Disclaimer of Warranties
              </h2>

              <div className="bg-bg-tertiary/50 border border-border rounded-lg p-6 my-6">
                <h3 className="text-xl font-semibold text-brand-primary mb-4">
                  LIMITATION OF LIABILITY
                </h3>
                <p className="text-text-primary leading-relaxed mb-4">
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
                  WILL WE, OR OUR AFFILIATES, OR ANY OF OUR RESPECTIVE
                  SHAREHOLDERS, MEMBERS, DIRECTORS, OFFICERS, EMPLOYEES,
                  ATTORNEYS, AGENTS, REPRESENTATIVES, SUPPLIERS OR CONTRACTORS
                  BE LIABLE FOR ANY DIRECT DAMAGES OR INCIDENTAL, INDIRECT,
                  SPECIAL, PUNITIVE, CONSEQUENTIAL OR SIMILAR DAMAGES OR
                  LIABILITIES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES
                  FOR LOSS OF DATA, INFORMATION, REVENUE, PROFITS OR OTHER
                  BUSINESSES OR FINANCIAL BENEFITS) WHETHER UNDER CONTRACT,
                  TORT, NEGLIGENCE, STATUTE, STRICT LIABILITY OR OTHER THEORY
                  EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH
                  DAMAGES.
                </p>
                <p className="text-text-primary leading-relaxed">
                  IN NO EVENT SHALL OUR LIABILITY TO YOU FOR ALL DAMAGES EXCEED
                  THE AMOUNT OF ONE HUNDRED U.S. DOLLARS ($USD100.00) OR ITS
                  EQUIVALENT IN THE LOCAL CURRENCY OF THE APPLICABLE
                  JURISDICTION.
                </p>
              </div>

              <div className="bg-bg-tertiary/50 border border-border rounded-lg p-6 my-6">
                <h3 className="text-xl font-semibold text-brand-primary mb-4">
                  WARRANTY DISCLAIMER
                </h3>
                <p className="text-text-primary leading-relaxed mb-4">
                  {branding.name.full.toUpperCase()} IS PROVIDED &ldquo;AS
                  IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;, AND WITHOUT WARRANTY
                  OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE
                  DISCLAIM ALL REPRESENTATIONS AND WARRANTIES, EXPRESS OR
                  IMPLIED, RELATING TO THE SERVICES AND UNDERLYING SOFTWARE OR
                  ANY ASPECT OF THE INFORMATION, CONTENT, OR THE SERVICES,
                  WHETHER PROVIDED OR OWNED BY US, OR BY ANY THIRD PARTY.
                </p>
                <p className="text-text-primary leading-relaxed">
                  WE DO NOT REPRESENT OR WARRANT THAT THE CONTENT ACCESSIBLE VIA
                  THE SERVICES IS ACCURATE, COMPLETE, AVAILABLE, CURRENT, FREE
                  OF VIRUSES OR OTHER HARMFUL COMPONENTS, OR THAT THE RESULTS OF
                  USING THE SERVICES WILL MEET YOUR REQUIREMENTS. SOME STATES DO
                  NOT ALLOW THE DISCLAIMER OF IMPLIED WARRANTIES, SO THE
                  FOREGOING DISCLAIMERS MAY NOT APPLY TO YOU.
                </p>
              </div>

              <p className="text-text-primary leading-relaxed">
                You acknowledge and accept that we cannot control, nor are
                obligated to act regarding potential failures, disruptions,
                mistakes, or delays in the processing of Digital Assets. You
                agree to hold us harmless and release us from all liability
                relating to any losses, damages, or claims resulting from user
                errors, server failures, data loss, unauthorized access, bugs,
                viruses, or any unsanctioned third-party activities.
              </p>
            </section>

            {/* Force Majeure */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Force Majeure
              </h2>
              <p className="text-text-primary leading-relaxed">
                We shall not be held liable for any delays, failure in
                performance, or interruptions of service which result directly
                or indirectly from any cause or condition beyond our reasonable
                control, including but not limited to: any delay or failure due
                to any acts of God, acts of civil or military authorities, acts
                of terrorism, civil or industrial disturbances, blockages,
                embargoes, war, strikes or other labor disputes, fire,
                earthquakes, storms or other nature-related events, interruption
                in electrical telecommunications or Internet services or network
                provider services, failure of hardware equipment and/or software
                or other utility failures, smart contract bugs or weaknesses,
                technological changes, changes in interest rates or other
                monetary conditions, and changes to any blockchain-related
                protocol.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Severability
              </h2>
              <p className="text-text-primary leading-relaxed">
                If it turns out that any part of this Agreement is invalid,
                void, or for any reason unenforceable, that term will be deemed
                severable and limited or eliminated to the minimum extent
                necessary. The limitation or elimination of the term shall not
                affect or impair the validity or enforceability of any remaining
                part of that term, clause or provision or any other terms,
                clauses or provisions of these Terms.
              </p>
            </section>

            {/* No Waiver */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                No Waiver
              </h2>
              <p className="text-text-primary leading-relaxed">
                Our failure to exercise or delay in exercising any right, power,
                or privilege under this Agreement shall not operate as a waiver;
                nor shall any single or partial exercise of any right, power, or
                privilege preclude any other or further exercise thereof. The
                waiver of any such right or provision will be effective only if
                in writing and signed by a duly authorized representative of us.
              </p>
            </section>

            {/* Assignment */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Assignment
              </h2>
              <p className="text-text-primary leading-relaxed">
                You agree that we may assign any of our rights and/or transfer,
                sub-contract, or delegate any of our obligations under these
                Terms without any notice or consent from you. These Terms will
                bind and inure to the benefit of the parties, their successors
                and permitted assigns. Your agreement to these Terms is personal
                to you and you may not transfer or assign it to any third party.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Entire Agreement
              </h2>
              <p className="text-text-primary leading-relaxed">
                This Agreement sets forth the entire understanding and agreement
                as to the subject matter hereof and supersedes any and all prior
                discussions, agreements, and understandings of any kind
                (including, without limitation, any prior versions of the Terms)
                and every nature between us. Except as provided for above, any
                modification to these Terms must be in writing and must be
                signed by both parties.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Questions or Comments
              </h2>
              <p className="text-text-primary leading-relaxed">
                If you have any questions relating to these Terms, your rights
                and obligations arising from these Terms and/or your use of{" "}
                {branding.name.full} and our Services or any other matter please
                send us a message at{" "}
                <a
                  href={`mailto:${branding.company.email}`}
                  className="text-brand-primary hover:underline"
                >
                  {branding.company.email}
                </a>
              </p>
            </section>

            {/* Copyright Notice */}
            <div className="mt-12 pt-8 border-t border-border text-center">
              <p className="text-text-secondary text-sm">
                {branding.name.copyright}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
