"use client"

import { useEffect, useState } from 'react'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, MapPin, Globe, Clock, Search } from 'lucide-react'
import Link from 'next/link'
import { getSupabaseClient } from "@/lib/supabase"
import { Input } from "@/components/ui/input"

interface UrgencyAssessment {
  urgency_level: 'red' | 'yellow' | 'green'
  recommended_departments: string[]
}

interface FacilityInfo {
  id: string
  official_name: string
  address: string
  latitude: number
  longitude: number
  homepage: string | null
  department_name: string
  department_code: string
  is_open_mon: boolean
  is_open_tue: boolean
  is_open_wed: boolean
  is_open_thu: boolean
  is_open_fri: boolean
  is_open_sat: boolean
  is_open_sun: boolean
  prefecture_code: string
  city_code: string
}

// 診療科名のマッピング
const DEPARTMENT_MAPPING: { [key: string]: string } = {
  '内科': '1001',
  '救急科': '1031',  // 救急科のコードを追加
  '精神科': '1002',
  '神経科': '1003',
  '神経内科': '1004',
  '呼吸器科': '1005',
  '消化器科': '1006',
  '循環器科': '1007',
  '小児科': '1008',
  '外科': '1009',
  '整形外科': '1010',
  '形成外科': '1011',
  '美容外科': '1012',
  '脳神経外科': '1013',
  '呼吸器外科': '1014',
  '心臓血管外科': '1015',
  '小児外科': '1016',
  '皮膚科': '1017',
  '泌尿器科': '1018',
  '産婦人科': '1019',
  '産科': '1020',
  '婦人科': '1021',
  '眼科': '1022',
  '耳鼻いんこう科': '1023',
  '耳鼻咽喉科': '1023',
  'リハビリテーション科': '1024',
  '放射線科': '1025',
  '麻酔科': '1026',
  '心療内科': '1027',
  'アレルギー科': '1028',
  'リウマチ科': '1029',
  '歯科': '1030',
}

// 診療科名の正規化関数
const normalizeDepartmentName = (name: string): string => {
  // スペースと全角スペースを削除
  const normalized = name.replace(/[\s　]/g, '')
  // 末尾の「科」を追加（ない場合）
  if (!normalized.endsWith('科')) {
    return `${normalized}科`
  }
  return normalized
}

// 診療科名から診療科コードを取得する関数
const getDepartmentCodes = (specialtyString: string): string[] => {
  // カンマ、スラッシュ、中黒、または・で区切られた診療科名を配列に分割
  const specialties = specialtyString.split(/[,、・/／]/).map(s => s.trim())
  
  // 各診療科名を正規化してコードを取得
  const codes = specialties
    .map(specialty => {
      const normalizedName = normalizeDepartmentName(specialty)
      return DEPARTMENT_MAPPING[normalizedName]
    })
    .filter((code): code is string => code !== undefined) // undefinedを除外

  return Array.from(new Set(codes)) // 重複を除去
}

export default function MedicalPage() {
  const searchParams = useSearchParams()
  const [assessment, setAssessment] = useState<UrgencyAssessment | null>(null)
  const [facilities, setFacilities] = useState<FacilityInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [postalCode, setPostalCode] = useState<string>('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const interviewId = searchParams.get('interview_id')
        const urgencyLevel = searchParams.get('urgency_level')
        
        if (!interviewId || !urgencyLevel) {
          setError('必要な情報が不足しています')
          return
        }

        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('urgency_assessments')
          .select('urgency_level, recommended_departments')
          .eq('interview_id', interviewId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) throw error

        setAssessment(data)
      } catch (err) {
        console.error('Error fetching assessment:', err)
        setError('評価結果の読み込みに失敗しました')
      }
    }

    fetchAssessment()
  }, [searchParams])

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    if (value.length <= 7) {
      setPostalCode(value)
    }
  }

  const handleSearch = async () => {
    if (postalCode.length !== 7) {
      setError('正しい郵便番号を入力してください（例：1234567）')
      return
    }

    if (!assessment?.recommended_departments) {
      setError('診療科情報が見つかりません')
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      // 診療科コードを取得
      const departmentCodes = getDepartmentCodes(assessment.recommended_departments.join(','))
      console.log('診療科コード:', departmentCodes)
      
      if (departmentCodes.length === 0) {
        console.error('マッピングされていない診療科名:', assessment.recommended_departments.join(','))
        setError(`指定された診療科「${assessment.recommended_departments.join(', ')}」の情報が見つかりません`)
        setIsLoading(false)
        return
      }

      // Supabaseクライアントを初期化
      const supabase = getSupabaseClient()

      // 郵便番号から住所情報を取得
      const postalResponse = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`
      )
      const postalData = await postalResponse.json()

      if (!postalData.results) {
        setError('郵便番号から住所情報を取得できませんでした')
        return
      }

      const addressInfo = postalData.results[0]
      const prefCode = addressInfo.prefcode.padStart(2, '0')

      // 住所から緯度経度を取得
      const geocodeResponse = await fetch(
        `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(
          `${addressInfo.address1}${addressInfo.address2}${addressInfo.address3}`
        )}`
      )
      const geocodeData = await geocodeResponse.json()

      if (!geocodeData || geocodeData.length === 0) {
        setError('住所から位置情報を取得できませんでした')
        return
      }

      const [longitude, latitude] = geocodeData[0].geometry.coordinates
      console.log('郵便番号の位置情報:', { latitude, longitude, address: `${addressInfo.address1}${addressInfo.address2}${addressInfo.address3}` })

      let foundFacilities: FacilityInfo[] = []
      let offset = 0
      const batchSize = 500 // より多くの施設を一度に取得

      // 5件の該当施設が見つかるまで繰り返し
      while (foundFacilities.length < 5) {
        // 施設を取得（都道府県での絞り込みを外す）
        const { data: facilityData, error: facilityError } = await supabase
          .from('facilities')
          .select(`
            id,
            official_name,
            address,
            latitude,
            longitude,
            homepage,
            prefecture_code,
            city_code,
            is_open_mon,
            is_open_tue,
            is_open_wed,
            is_open_thu,
            is_open_fri,
            is_open_sat,
            is_open_sun
          `)
          .range(offset, offset + batchSize - 1)

        if (facilityError) {
          console.error('Facility error:', facilityError)
          throw facilityError
        }

        if (!facilityData || facilityData.length === 0) {
          break
        }

        // 距離を計算してソート
        const facilitiesWithDistance = facilityData
          .filter(facility => 
            facility.latitude && 
            facility.longitude && 
            !isNaN(parseFloat(facility.latitude)) && 
            !isNaN(parseFloat(facility.longitude))
          )
          .map(facility => ({
            ...facility,
            distance: calculateDistance(
              latitude,
              longitude,
              parseFloat(facility.latitude),
              parseFloat(facility.longitude)
            )
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 100) // 近い100件に絞る

        // デバッグ用のログ出力
        console.log('距離計算結果:', facilitiesWithDistance.map(f => ({
          name: f.official_name,
          address: f.address,
          distance: f.distance.toFixed(2) + 'km'
        })))

        // 近い順に並んだ施設の診療科を確認
        const facilityIds = facilitiesWithDistance.map(f => f.id)
        const { data: departmentData, error: departmentError } = await supabase
          .from('departments')
          .select('facility_id, department_code, department_name')
          .in('facility_id', facilityIds)
          .or(departmentCodes.map(code => `department_code.eq.${code}`).join(','))

        if (departmentError) {
          console.error('Department error:', departmentError)
          throw departmentError
        }

        // 施設情報と診療科情報を結合
        const validFacilities = facilitiesWithDistance
          .map(facility => {
            const facilityDepartments = departmentData?.filter(
              dept => dept.facility_id === facility.id
            ) || []
            
            if (facilityDepartments.length === 0) return null

            return {
              ...facility,
              department_name: facilityDepartments.map(d => d.department_name).join('、'),
              department_code: facilityDepartments.map(d => d.department_code).join(','),
            }
          })
          .filter((data): data is (FacilityInfo & { distance: number }) => data !== null)

        // 見つかった施設を追加
        foundFacilities = [...foundFacilities, ...validFacilities]

        // 次のバッチのために offset を更新
        offset += batchSize

        // 2000件まで検索しても見つからない場合は終了
        if (offset >= 2000) {
          break
        }
      }

      // 最終的に近い順5件を設定
      setFacilities(foundFacilities.slice(0, 5))
    } catch (err) {
      console.error('Error fetching facilities:', err)
      setError(
        err instanceof Error 
          ? `医療機関情報の取得に失敗しました: ${err.message}`
          : '医療機関情報の取得に失敗しました'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ヒュベニの公式を使用して2点間の距離を計算
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // 緯度経度をラジアンに変換
    const radLat1 = lat1 * Math.PI / 180
    const radLon1 = lon1 * Math.PI / 180
    const radLat2 = lat2 * Math.PI / 180
    const radLon2 = lon2 * Math.PI / 180

    // 緯度差、経度差
    const latDiff = radLat2 - radLat1
    const lonDiff = radLon2 - radLon1

    // 平均緯度
    const latAvg = (radLat1 + radLat2) / 2.0

    // 測地系による値の違い
    const e2 = 0.00669437999019758  // WGS84の第一離心率の二乗
    const w = Math.sqrt(1 - e2 * Math.pow(Math.sin(latAvg), 2))
    const m = 6334834 / Math.pow(w, 3)  // 子午線曲率半径
    const n = 6377397 / w                // 卯酉線曲率半径

    // 距離計算
    const distance = Math.sqrt(
      Math.pow(m * latDiff, 2) +
      Math.pow(n * lonDiff * Math.cos(latAvg), 2)
    ) / 1000  // メートルからキロメートルに変換

    return distance
  }

  const formatTime = (time: string | null) => {
    if (!time) return '休診'
    return time.substring(0, 5) // "HH:mm"の形式に整形
  }

  const renderBusinessHours = (facility: FacilityInfo) => {
    const days = [
      { label: '月', isOpen: facility.is_open_mon },
      { label: '火', isOpen: facility.is_open_tue },
      { label: '水', isOpen: facility.is_open_wed },
      { label: '木', isOpen: facility.is_open_thu },
      { label: '金', isOpen: facility.is_open_fri },
      { label: '土', isOpen: facility.is_open_sat },
      { label: '日', isOpen: facility.is_open_sun },
    ]

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="font-semibold">診療日</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {days.map((day, index) => (
            <div key={index} className="text-center">
              <div className="font-semibold">{day.label}</div>
              <div className="text-gray-600">
                {day.isOpen ? '〇' : '休'}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderUrgencyMessage = () => {
    if (!assessment) return null

    switch (assessment.urgency_level) {
      case 'red':
        return (
          <Card className="bg-red-50 border-red-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600 mb-2">
                <AlertCircle className="h-5 w-5" />
                <h2 className="font-semibold">緊急性の高い症状があります</h2>
              </div>
              <p className="text-red-700">
                直ちに救急車を呼ぶことをお勧めします。救急車を呼ぶ場合は119番に電話してください。
              </p>
            </CardContent>
          </Card>
        )
      case 'yellow':
        return (
          <Card className="bg-yellow-50 border-yellow-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-yellow-600 mb-2">
                <AlertCircle className="h-5 w-5" />
                <h2 className="font-semibold">早めの受診をお勧めします</h2>
              </div>
              <p className="text-yellow-700">
                できるだけ早く（本日中に）医療機関を受診することをお勧めします。
              </p>
            </CardContent>
          </Card>
        )
      case 'green':
        return (
          <Card className="bg-green-50 border-green-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-green-600 mb-2">
                <AlertCircle className="h-5 w-5" />
                <h2 className="font-semibold">受診をお勧めします</h2>
              </div>
              <p className="text-green-700">
                体調に応じて医療機関の受診を検討してください。
              </p>
            </CardContent>
          </Card>
        )
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assessment) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {renderUrgencyMessage()}

        {assessment?.recommended_departments && assessment.recommended_departments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>推奨される診療科</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1">
                {assessment.recommended_departments.map((dept, index) => (
                  <li key={index} className="text-gray-700">{dept}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {assessment?.urgency_level !== 'red' && (
          <Card>
            <CardHeader>
              <CardTitle>医療機関を探す</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="postal-code"
                      type="text"
                      placeholder="1234567"
                      value={postalCode}
                      onChange={handlePostalCodeChange}
                      maxLength={7}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading || postalCode.length !== 7}
                    >
                      {isLoading ? '検索中...' : '検索'}
                    </Button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                {hasSearched && facilities.length === 0 && !isLoading && !error && (
                  <p className="text-gray-500">
                    お近くの対応医療機関が見つかりませんでした。
                  </p>
                )}

                {facilities.length > 0 && (
                  <div className="space-y-4">
                    {facilities.map((facility, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-lg mb-2">{facility.official_name}</h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{facility.address}</span>
                            </div>
                            {facility.homepage && (
                              <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4" />
                                <a
                                  href={facility.homepage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  ウェブサイト
                                </a>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                診療日：
                                {[
                                  facility.is_open_mon && '月',
                                  facility.is_open_tue && '火',
                                  facility.is_open_wed && '水',
                                  facility.is_open_thu && '木',
                                  facility.is_open_fri && '金',
                                  facility.is_open_sat && '土',
                                  facility.is_open_sun && '日'
                                ].filter(Boolean).join('・')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 