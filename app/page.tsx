import { auth } from '@/auth'
import { CurationApp } from '@/components/CurationApp'

export default async function Home() {
  const session = await auth()
  return <CurationApp user={session?.user ?? null} />
}
