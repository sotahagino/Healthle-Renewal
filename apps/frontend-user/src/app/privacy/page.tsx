import Link from 'next/link'
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { SiteHeader } from '../../components/site-header'
import { Footer } from '../../components/footer'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/" passHref>
            <Button variant="link" className="mb-4 text-[#4C9A84]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ホームに戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-6 text-[#333333]">プライバシーポリシー</h1>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 space-y-4">
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">1. 個人情報の収集</h2>
                <p className="text-[#666666]">
                  当社は、本サービスの提供にあたり、以下の個人情報を収集することがあります：
                </p>
                <ul className="list-disc pl-5 mt-2 text-[#666666]">
                  <li>氏名</li>
                  <li>メールアドレス</li>
                  <li>電話番号</li>
                  <li>住所</li>
                  <li>健康に関する情報</li>
                  <li>その他当社が定める入力フォームにユーザーが入力する情報</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">2. 個人情報の利用目的</h2>
                <p className="text-[#666666]">
                  当社は、収集した個人情報を以下の目的で利用します：
                </p>
                <ul className="list-disc pl-5 mt-2 text-[#666666]">
                  <li>本サービスの提供・運営のため</li>
                  <li>ユーザーからのお問い合わせに対応するため</li>
                  <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                  <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
                  <li>上記の利用目的に付随する目的</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">3. 個人情報の第三者提供</h2>
                <p className="text-[#666666]">
                  当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
                </p>
                <ul className="list-disc pl-5 mt-2 text-[#666666]">
                  <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                  <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">4. 個人情報の開示</h2>
                <p className="text-[#666666]">
                  当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
                </p>
                <ul className="list-disc pl-5 mt-2 text-[#666666]">
                  <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                  <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                  <li>その他法令に違反することとなる場合</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">5. 個人情報の訂正および削除</h2>
                <p className="text-[#666666]">
                  ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下、「訂正等」といいます。）を請求することができます。
                </p>
                <p className="mt-2 text-[#666666]">
                  当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。
                </p>
                <p className="mt-2 text-[#666666]">
                  当社は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これをユーザーに通知します。
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

