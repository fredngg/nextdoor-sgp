"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"

export function CommercialFallback() {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gray-100 p-3 rounded-full">
              <Info className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">This address is a commercial location</h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              nextdoor.sg is currently focused on residential HDB, condo, and landed communities. We may expand into
              commercial locations in the future. Stay tuned!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
