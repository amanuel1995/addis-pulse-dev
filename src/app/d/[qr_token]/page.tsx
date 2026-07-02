import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ qr_token: string }>
}

export default async function DriverQRRoute({ params }: PageProps) {
  const { qr_token } = await params
  const supabase = await createClient()

  // 1. Resolve the driver's QR token to an active campaign
  const { data: resolutionData, error: resolveError } = await supabase
    .rpc('resolve_driver_campaign', { p_qr_token: qr_token })
    .single()

  const resolution = resolutionData as { 
    driver_id: string; 
    campaign_id: string; 
    company_id: string; 
    driver_name: string; 
    campaign_status: string 
  } | null

  if (resolveError || !resolution) {
    // Driver doesn't exist, is suspended, or has no active campaign
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unavailable</h1>
        <p className="text-gray-600 max-w-md">
          This QR code is not currently associated with an active campaign. Please ask your driver for more information.
        </p>
      </div>
    )
  }

  // 2. We have a valid active campaign. Fetch company & campaign details.
  const { data: campaignData, error: campaignError } = await supabase
    .from('campaigns')
    .select(`
      *,
      companies (
        name,
        logo_url,
        brand_color,
        description
      )
    `)
    .eq('id', resolution.campaign_id)
    .single()

  if (campaignError || !campaignData) {
    return notFound()
  }

  const company = campaignData.companies
  const config = campaignData.landing_page_config || {}

  // Defaults fallback
  const brandColor = company?.brand_color || '#1A3A5C' 
  const headline = config.headline || `Welcome to ${company?.name || 'our campaign'}!`
  const amharicHeadline = config.amharic_headline || headline
  const offerText = config.offer_text || campaignData.reward_description || 'Submit your details to claim your reward.'
  const amharicOfferText = config.amharic_offer_text || offerText

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header 
        className="w-full p-6 text-white text-center" 
        style={{ backgroundColor: brandColor }}
      >
        <h1 className="text-3xl font-bold mb-2">{headline}</h1>
        <h2 className="text-xl opacity-90">{amharicHeadline}</h2>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        {company?.logo_url && (
          <div className="flex justify-center mb-8">
            <img 
              src={company.logo_url} 
              alt={`${company.name} Logo`} 
              className="h-20 object-contain" 
            />
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-lg text-gray-700 mb-2">{offerText}</p>
          <p className="text-md text-gray-600">{amharicOfferText}</p>
        </div>

        {/* Lead Capture Form Wrapper - we will build this component next */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 mb-4 text-center">
            Your driver: <span className="font-semibold text-gray-700">{resolution.driver_name}</span>
          </p>
          
          {/* Placeholder for LeadForm client component */}
          <div className="border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 rounded-lg">
            [Lead Capture Form Component]
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400">
        Powered by AddisPulse Media
      </footer>
    </div>
  )
}
