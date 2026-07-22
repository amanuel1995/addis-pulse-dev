import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { LeadForm } from '@/components/lead/LeadForm'

export const revalidate = 60 // ISR: absorbs QR scan bursts while keeping data fresh

interface PageProps {
  params: Promise<{ qr_token: string }>
}

type LocalizedLandingPayload = {
  campaign?: {
    content?: {
      headline?: string;
      offer_text?: string;
    };
  };
}

export default async function DriverQRRoute({ params }: PageProps) {
  const { qr_token } = await params
  const supabase = await createClient()

  // Resolve the driver's QR token to an active campaign (single round-trip RPC)
  const { data: resolutionData, error: resolveError } = await supabase
    .rpc('resolve_driver_campaign', { p_qr_token: `d/${qr_token}` })
    .single()

  // C-2 fix: throw on transient DB errors so they are NOT ISR-cached as 404.
  // Only call notFound() when the token genuinely has no active campaign.
  if (resolveError) {
    throw new Error(`Failed to resolve QR token: ${resolveError.message}`)
  }

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

  if (!campaign) {
    const { data: availability, error: availabilityError } = await supabase.rpc(
      'get_public_landing_page',
      { p_public_path: `d/${qr_token}`, p_locale: 'en' }
    )
    if (availabilityError) {
      throw new Error(`Failed to check QR availability: ${availabilityError.message}`)
    }
    const state = availability as { available?: boolean; reason?: string } | null
    if (state?.reason === 'invalid_qr') return notFound()
    redirect(`/d/${encodeURIComponent(qr_token)}/inactive`)
  }

  const config = campaign.landing_config || {}
  const { data: amharicData, error: amharicError } = await supabase.rpc(
    'get_public_landing_page',
    { p_public_path: `d/${qr_token}`, p_locale: 'am' }
  )
  if (amharicError) {
    throw new Error(`Failed to load localized campaign: ${amharicError.message}`)
  }
  const amharicContent = (amharicData as LocalizedLandingPayload | null)
    ?.campaign?.content

  // Defaults fallback
  const brandColor = campaign.brand_color || '#1A3A5C' 
  const headline = config.headline || `Welcome to ${campaign.company_name || 'our campaign'}!`
  const amharicHeadline = amharicContent?.headline || config.amharic_headline || headline
  const offerText = config.offer_text || campaign.reward_desc || 'Submit your details to claim your reward.'
  const amharicOfferText = amharicContent?.offer_text || config.amharic_offer_text || offerText
  const logoUrl = campaign.logo_url
    ? campaign.logo_url.startsWith('http://') || campaign.logo_url.startsWith('https://')
      ? campaign.logo_url
      : supabase.storage.from('company-assets').getPublicUrl(campaign.logo_url).data.publicUrl
    : null

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
        {logoUrl && (
          <div className="flex justify-center mb-8">
            <Image
              src={logoUrl}
              alt={`${campaign.company_name} Logo`}
              width={200}
              height={80}
              className="h-20 w-auto object-contain"
              priority
              unoptimized
            />
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-lg text-gray-700 mb-2">{offerText}</p>
          <p className="text-md text-gray-600">{amharicOfferText}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 mb-4 text-center">
            Your driver: <span className="font-semibold text-gray-700">{campaign.driver_name}</span>
          </p>
          
          <LeadForm
            qrToken={qr_token}
            brandColor={brandColor}
            callToAction={config.call_to_action}
            privacyNotice={config.privacy_notice_text}
          />
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400">
        Powered by AddisPulse Media
      </footer>
    </div>
  )
}
