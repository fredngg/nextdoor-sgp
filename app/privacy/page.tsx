import { Navigation } from "../components/navigation"
import { Footer } from "../components/footer"

export default function PrivacyPolicy() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white pt-16 flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  MyNextDoor.sg ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your information when you use our community
                  platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                    <p className="text-gray-700 leading-relaxed">
                      We may collect personal information such as your name, email address, postal code, and other
                      information you provide when creating an account or using our services.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Information</h3>
                    <p className="text-gray-700 leading-relaxed">
                      We collect information about how you use our platform, including your interactions with posts,
                      comments, and community features.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>To provide and maintain our community platform</li>
                  <li>To connect you with your local community</li>
                  <li>To send you notifications about community activities</li>
                  <li>To improve our services and user experience</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
                <p className="text-gray-700 leading-relaxed">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your
                  consent, except as described in this policy or as required by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate security measures to protect your personal information against unauthorized
                  access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a href="mailto:privacy@mynextdoor.sg" className="text-red-600 hover:underline">
                    privacy@mynextdoor.sg
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}
