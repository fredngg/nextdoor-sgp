import { Building2, Users, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function CommercialFallback() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Commercial Address Detected</h2>
        <p className="text-gray-600">
          This appears to be a commercial or office building. MyNextDoor.sg is designed for residential communities.
        </p>
      </div>

      <Card className="border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Looking for a residential community?</span>
            </div>
            <p className="text-gray-600 text-sm">
              If you live in a nearby residential area, try searching with your home postal code instead.
            </p>

            <div className="flex items-center gap-3 mt-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Business networking coming soon</span>
            </div>
            <p className="text-gray-600 text-sm">
              We're working on features for commercial areas and business networking. Stay tuned!
            </p>

            <div className="mt-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Commercial Area
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
