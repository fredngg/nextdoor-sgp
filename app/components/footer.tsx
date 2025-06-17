import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-red-600 mb-4">nextdoor.sg</h3>
            <p className="text-gray-600 text-sm">
              Connect with your local HDB and condo communities across Singapore.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-red-600 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-red-600 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
            <p className="text-gray-600 text-sm">
              Questions or feedback? Contact us at{" "}
              <a href="mailto:hello@nextdoor.sg" className="text-red-600 hover:underline">
                hello@nextdoor.sg
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} nextdoor.sg. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
