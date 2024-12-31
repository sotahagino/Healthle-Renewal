'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle, Flag } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Mock data for user consultations
const mockConsultations = [
  { 
    id: 'CON001', 
    date: '2023-06-01 14:30', 
    summary: '頭痛が続いています', 
    aiResponse: 'しばらく様子を見て、改善しない場合は医療機関の受診をお勧めします。',
    flagged: false,
    adminNote: ''
  },
  { 
    id: 'CON002', 
    date: '2023-05-15 10:45', 
    summary: '睡眠薬の副作用について', 
    aiResponse: '睡眠薬には様々な副作用がありますが、個人差も大きいです。詳しくは処方された医師にご相談ください。',
    flagged: true,
    adminNote: '睡眠薬の乱用の可能性があるため、注意が必要。'
  },
  { 
    id: 'CON003', 
    date: '2023-05-02 16:20', 
    summary: 'ダイエットサプリメントの効果', 
    aiResponse: 'ダイエットサプリメントの効果は個人差があります。バランスの取れた食事と適度な運動が基本です。',
    flagged: false,
    adminNote: ''
  },
]

export default function UserConsultations({ params }: { params: { userId: string } }) {
  const router = useRouter()
  const [consultations, setConsultations] = useState(mockConsultations)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedConsultation, setSelectedConsultation] = useState<typeof mockConsultations[0] | null>(null)

  useEffect(() => {
    // Simulate API call
    const fetchConsultations = async () => {
      try {
        // In a real application, you would fetch the consultation data here
        await new Promise(resolve => setTimeout(resolve, 1000))
        setConsultations(mockConsultations)
        setLoading(false)
      } catch (err) {
        setError('相談履歴の取得に失敗しました。')
        setLoading(false)
      }
    }

    fetchConsultations()
  }, [params.userId])

  const handleFlag = (id: string) => {
    setConsultations(prevConsultations =>
      prevConsultations.map(consultation =>
        consultation.id === id ? { ...consultation, flagged: !consultation.flagged } : consultation
      )
    )
  }

  const handleAdminNote = (id: string, note: string) => {
    setConsultations(prevConsultations =>
      prevConsultations.map(consultation =>
        consultation.id === id ? { ...consultation, adminNote: note } : consultation
      )
    )
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ユーザー相談履歴 - {params.userId}</h1>
      <Card>
        <CardHeader>
          <CardTitle>相談一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>要約</TableHead>
                <TableHead>フラグ</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultations.map((consultation) => (
                <TableRow key={consultation.id}>
                  <TableCell>{consultation.date}</TableCell>
                  <TableCell>{consultation.summary}</TableCell>
                  <TableCell>
                    {consultation.flagged && (
                      <Badge variant="destructive">
                        <Flag className="w-4 h-4 mr-1" />
                        要注意
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedConsultation(consultation)}
                    >
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>相談詳細 - {selectedConsultation?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <h3 className="font-semibold">日付</h3>
              <p>{selectedConsultation?.date}</p>
            </div>
            <div>
              <h3 className="font-semibold">要約</h3>
              <p>{selectedConsultation?.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold">AI回答</h3>
              <p>{selectedConsultation?.aiResponse}</p>
            </div>
            <div>
              <Label htmlFor="adminNote">管理者メモ</Label>
              <Textarea
                id="adminNote"
                value={selectedConsultation?.adminNote}
                onChange={(e) => selectedConsultation && handleAdminNote(selectedConsultation.id, e.target.value)}
                placeholder="管理者メモを入力"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant={selectedConsultation?.flagged ? "outline" : "destructive"}
              onClick={() => selectedConsultation && handleFlag(selectedConsultation.id)}
            >
              {selectedConsultation?.flagged ? 'フラグ解除' : 'フラグ付け'}
            </Button>
            <Button variant="outline" onClick={() => setSelectedConsultation(null)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push(`/users/${params.userId}`)}>
          ユーザー詳細に戻る
        </Button>
      </div>
    </div>
  )
}

