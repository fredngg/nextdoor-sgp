import { Navigation } from "../components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "../components/footer"

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">Privacy Policy – nextdoor.sg</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <div className="space-y-6 text-gray-700">
                  <p>
                    nextdoor.sg collects only the information needed to support your use of the platform, 
                    including your email address for login purposes and your posts and comments.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-900">
                      We do not sell or share your personal data with third parties.
                    </p>
                  </div>

                  <p>
                    If you log in via Supabase, your data is stored securely with Supabase under their 
                    privacy and security practices.
                  </p>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-medium text-green-900">
                      You may contact us to delete your account or data at any time.
                    </p>
                  </div>

                  <div className="mt-6">
                    <p className="text-gray-600 text-sm">
                      This policy may change in future to reflect product improvements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
