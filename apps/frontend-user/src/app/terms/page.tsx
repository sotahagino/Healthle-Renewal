import Link from 'next/link'
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { SiteHeader } from '../../components/site-header'
import { Footer } from '../../components/footer'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold mb-6 text-[#333333]">利用規約</h1>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 space-y-4">
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">1. はじめに</h2>
                <p className="text-[#666666]">
                  この利用規約（以下、「本規約」といいます。）は、Healthle（以下、「当社」といいます。）がこのウェブサイト上で提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">2. 利用登録</h2>
                <p className="text-[#666666]">
                  本サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、本サービスの利用登録が完了するものとします。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">3. ユーザーIDおよびパスワードの管理</h2>
                <p className="text-[#666666]">
                  ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">4. 禁止事項</h2>
                <p className="text-[#666666]">
                  ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                </p>
                <ul className="list-disc pl-5 mt-2 text-[#666666]">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>当社、本サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                  <li>本サービスの運営を妨害するおそれのある行為</li>
                  <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                  <li>不正アクセスをし、またはこれを試みる行為</li>
                  <li>他のユーザーに成りすます行為</li>
                  <li>当社が許諾しない本サービス上での宣伝、広告、勧誘、または営業行為</li>
                  <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">5. 本サービスの提供の停止等</h2>
                <p className="text-[#666666]">
                  当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                </p>
                <ul className="list-disc pl-5 mt-2 text-[#666666]">
                  <li>本サービスにかかるコンピューターシステムの保守点検または更新を行う場合</li>
                  <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                  <li>コンピューターまたは通信回線等が事故により停止した場合</li>
                  <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                </ul>
                <p className="mt-2 text-[#666666]">
                  当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">6. 著作権</h2>
                <p className="text-[#666666]">
                  ユーザーは、自ら著作権等の必要な知的財産権を有するか、または必要な権利者の許諾を得た文章、画像や映像等の情報に関してのみ、本サービスを利用し、投稿ないしアップロードすることができるものとします。
                </p>
                <p className="mt-2 text-[#666666]">
                  ユーザーが本サービスを利用して投稿ないしアップロードした文章、画像、映像等の著作権については、当該ユーザーその他既存の権利者に留保されるものとします。ただし、当社は、本サービスを利用して投稿ないしアップロードされた文章、画像、映像等について、本サービスの改良、品質の向上、または不備の是正等ならびに本サービスの周知宣伝等に必要な範囲で利用できるものとし、ユーザーは、この利用に関して、著作者人格権を行使しないものとします。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">7. 保証の否認および免責事項</h2>
                <p className="text-[#666666]">
                  当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                </p>
                <p className="mt-2 text-[#666666]">
                  当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">8. サービス内容の変更等</h2>
                <p className="text-[#666666]">
                  当社は、ユーザーへの事前の告知なしに、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">9. 利用規約の変更</h2>
                <p className="text-[#666666]">
                  当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">10. 通知または連絡</h2>
                <p className="text-[#666666]">
                  ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">11. 権利義務の譲渡の禁止</h2>
                <p className="text-[#666666]">
                  ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-2 text-[#4C9A84]">12. 準拠法・裁判管轄</h2>
                <p className="text-[#666666]">
                  本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
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

