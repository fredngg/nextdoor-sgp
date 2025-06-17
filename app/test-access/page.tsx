"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { testUnauthenticatedAccess } from "@/lib/test-supabase-access"

export default function TestAccessPage() {
  const [results, setResults] = useState<string[]>([])
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    setTesting(true)
    setResults([])

    // Capture console logs
    const originalLog = console.log
    const originalError = console.error
    const logs: string[] = []

    console.log = (...args) => {
      logs.push(args.join(" "))
      originalLog(...args)
    }

    console.error = (...args) => {
      logs.push("ERROR: " + args.join(" "))
      originalError(...args)
    }

    try {
      await testUnauthenticatedAccess()
    } catch (error) {
      logs.push("FATAL ERROR: " + String(error))
    }

    // Restore console
    console.log = originalLog
    console.error = originalError

    setResults(logs)
    setTesting(false)
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Supabase Access Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTest} disabled={testing} className="bg-red-600 hover:bg-red-700">
            {testing ? "Testing..." : "Test Unauthenticated Access"}
          </Button>

          {results.length > 0 && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1 font-mono text-sm">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className={
                      result.includes("ERROR")
                        ? "text-red-600"
                        : result.includes("✅")
                          ? "text-green-600"
                          : "text-gray-700"
                    }
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
