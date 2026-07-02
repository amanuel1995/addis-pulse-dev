import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const revalidate = 60 // Revalidate cache every 60 seconds (absorb high traffic while keeping data fresh)

interface PageProps {
  params: Promise<{ qr_token: string }>
}

export default async function DriverQRRoute({ params }: PageProps) {
  const { qr_token } = await params
  const supabase = await createClient()

  // Resolve the driver's QR token to an active campaign (single round-trip RPC)
  const { data: resolutionData, error: resolveError } = await supabase
    .rpc('resolve_driver_campaign', { p_qr_token: qr_token })
    .single()

  const campaign = resolutionData as { 
    driver_id: string; 
    driver_name: string;
    campaign_id: string; 
    company_id: string; 
    campaign_name: string; 
    company_name: string;
    logo_url: string;
    brand_color: string;
    landing_config: Record<string, string>;
    reward_desc: string;
  } | null

  if (resolveError || !campaign) {
    // If the token is invalid, missing, or inactive, return 404 for SEO/caching purposes
    return notFound()
  }

  const config = campaign.landing_config || {}

  // Defaults fallback
  const brandColor = campaign.brand_color || '#1A3A5C' 
  const headline = config.headline || `Welcome to ${campaign.company_name || 'our campaign'}!`
  const amharicHeadline = config.amharic_headline || headline
  const offerText = config.offer_text || campaign.reward_desc || 'Submit your details to claim your reward.'
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
        {campaign.logo_url && (
          <div className="flex justify-center mb-8">
            <img 
              src={campaign.logo_url} 
              alt={`${campaign.company_name} Logo`} 
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
            Your driver: <span className="font-semibold text-gray-700">{campaign.driver_name}</span>
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
