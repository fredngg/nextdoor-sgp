import { Navigation } from "../components/navigation"
import { Footer } from "../components/footer"

export default function TermsOfService() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white pt-16 flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using MyNextDoor.sg, you accept and agree to be bound by the terms and provision of
                  this agreement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use License</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Permission is granted to temporarily use MyNextDoor.sg for personal, non-commercial transitory viewing
                  only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display</li>
                  <li>attempt to reverse engineer any software contained on the website</li>
                  <li>remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Community Guidelines</h2>
                <p className="text-gray-700 leading-relaxed mb-4">When using our community platform, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Be respectful and kind to other community members</li>
                  <li>Not post spam, harassment, or inappropriate content</li>
                  <li>Respect privacy and not share personal information of others</li>
                  <li>Use the platform only for legitimate community purposes</li>
                  <li>Report any violations of these guidelines</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
                <p className="text-gray-700 leading-relaxed">
                  The materials on MyNextDoor.sg are provided on an 'as is' basis. MyNextDoor.sg makes no warranties,
                  expressed or implied, and hereby disclaims and negates all other warranties including without
                  limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or
                  non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:legal@mynextdoor.sg" className="text-red-600 hover:underline">
                    legal@mynextdoor.sg
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
