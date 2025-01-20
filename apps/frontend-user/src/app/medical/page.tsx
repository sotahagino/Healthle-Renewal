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

interface TriageResponse {
  triageResult: 'self_care' | 'medical_consultation'
  reason: string
  recommendedSpecialty: string
}

interface FacilityInfo {
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
  // カンマまたは、で区切られた診療科名を配列に分割
  const specialties = specialtyString.split(/[,、]/).map(s => s.trim())
  
  // 各診療科名を正規化してコードを取得
  const codes = specialties
    .map(specialty => {
      const normalizedName = normalizeDepartmentName(specialty)
      return DEPARTMENT_MAPPING[normalizedName]
    })
    .filter((code): code is string => code !== undefined) // undefinedを除外

  return codes
}

export default function MedicalPage() {
  const searchParams = useSearchParams()
  const [triageResponse, setTriageResponse] = useState<TriageResponse | null>(null)
  const [facilities, setFacilities] = useState<FacilityInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [postalCode, setPostalCode] = useState<string>('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    try {
      const triageParam = searchParams.get('triage')
      if (!triageParam) {
        setError('トリアージ結果が見つかりません')
        return
      }

      const decodedTriage = JSON.parse(decodeURIComponent(triageParam)) as TriageResponse
      console.log('推奨診療科:', decodedTriage.recommendedSpecialty)
      setTriageResponse(decodedTriage)
    } catch (err) {
      console.error('Error parsing triage response:', err)
      setError('トリアージ結果の読み込みに失敗しました')
    }
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

    if (!triageResponse?.recommendedSpecialty) {
      setError('診療科情報が見つかりません')
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      // 診療科コードを取得
      const departmentCodes = getDepartmentCodes(triageResponse.recommendedSpecialty)
      console.log('診療科コード:', departmentCodes)
      
      if (departmentCodes.length === 0) {
        console.error('マッピングされていない診療科名:', triageResponse.recommendedSpecialty)
        setError(`指定された診療科「${triageResponse.recommendedSpecialty}」の情報が見つかりません`)
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

      // まず診療科を持つ施設IDを取得
      const { data: departmentData, error: departmentError } = await supabase
        .from('departments')
        .select('facility_id, department_code')
        .in('department_code', departmentCodes)

      if (departmentError) {
        console.error('Department error:', departmentError)
        throw departmentError
      }

      if (!departmentData || departmentData.length === 0) {
        console.log('診療科に対応する施設が見つかりません')
        setFacilities([])
        return
      }

      console.log('取得した施設ID:', departmentData)

      // 取得した施設IDを使用して施設情報を取得（末尾のスペースを保持）
      const facilityIds = [...new Set(departmentData.map(d => d.facility_id))]
      console.log('整形後の施設ID（重複除去済み）:', facilityIds)
      
      // 都道府県コードから先頭の0を削除し、数値に変換して文字列に戻す
      const prefCodeNumber = parseInt(prefCode)
      const prefCodeString = prefCodeNumber.toString()
      console.log('データベース形式の都道府県コード:', prefCodeString)
      
      // 都道府県コードで検索（TEXT型として扱う）
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
        .in('id', facilityIds)
        .eq('prefecture_code', prefCodeString)

      if (facilityError) {
        console.error('Facility error:', facilityError)
        throw facilityError
      }

      if (!facilityData || facilityData.length === 0) {
        console.log('都道府県内で施設が見つかりません')
        setFacilities([])
        return
      }

      // 診療科情報を取得
      const { data: departmentsData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .in('facility_id', facilityData.map(f => f.id))
        .in('department_code', departmentCodes)

      if (deptError) {
        console.error('Departments error:', deptError)
        throw deptError
      }

      // 施設情報と診療科情報を結合
      const combinedData = facilityData.map(facility => {
        const facilityDepartments = departmentsData?.filter(
          dept => dept.facility_id.trim() === facility.id.trim()
        ) || []
        
        if (facilityDepartments.length === 0) return null

        return {
          official_name: facility.official_name,
          address: facility.address,
          latitude: facility.latitude,
          longitude: facility.longitude,
          homepage: facility.homepage,
          department_name: facilityDepartments[0].department_name,
          department_code: facilityDepartments[0].department_code,
          is_open_mon: facility.is_open_mon,
          is_open_tue: facility.is_open_tue,
          is_open_wed: facility.is_open_wed,
          is_open_thu: facility.is_open_thu,
          is_open_fri: facility.is_open_fri,
          is_open_sat: facility.is_open_sat,
          is_open_sun: facility.is_open_sun,
          prefecture_code: facility.prefecture_code,
          city_code: facility.city_code
        }
      }).filter((data): data is FacilityInfo => data !== null)

      // 郵便番号の代表点からの距離でソート
      const sortedData = combinedData
        .map(facility => {
          const distance = calculateDistance(
            latitude,
            longitude,
            facility.latitude,
            facility.longitude
          )
          console.log(`施設: ${facility.official_name}, 距離: ${distance.toFixed(2)}km, 緯度経度: [${facility.latitude}, ${facility.longitude}]`)
          return {
            ...facility,
            distance
          }
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)

      console.log('検索基準点:', {
        latitude,
        longitude,
        address: `${addressInfo.address1}${addressInfo.address2}${addressInfo.address3}`
      })

      setFacilities(sortedData)
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

  // ヒュベニの公式を使用して2点間の距離を計算（より正確な距離計算）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // 距離（km）
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

  if (!triageResponse) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8 border-l-4 border-l-primary shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-primary">
            医療機関への受診をお勧めします
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">判断理由</h3>
              <p className="text-gray-700 leading-relaxed">{triageResponse.reason}</p>
            </div>
            
            {triageResponse.recommendedSpecialty && (
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">推奨される診療科</h3>
                <p className="text-primary font-medium text-lg">{triageResponse.recommendedSpecialty}</p>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">注意事項</h3>
              <ul className="list-none space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">•</span>
                  <span>この判断は参考情報です。実際の受診については、ご自身でご判断ください。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">•</span>
                  <span>症状が重い場合や急を要する場合は、すぐに救急医療機関を受診してください。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">•</span>
                  <span>かかりつけ医がいる場合は、まずはかかりつけ医に相談することをお勧めします。</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 郵便番号入力フォーム */}
      <Card className="mb-8 shadow-md">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-primary mb-6">
            お近くの医療機関を探す
          </h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="郵便番号を入力（例：1234567）"
                value={postalCode}
                onChange={handlePostalCodeChange}
                maxLength={7}
                className="text-lg h-12"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || postalCode.length !== 7}
              className="min-w-[120px] h-12 text-lg text-white"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  検索
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 医療機関リスト */}
      {hasSearched && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-primary mb-6">
            検索結果
          </h2>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                </div>
              </CardContent>
            </Card>
          ) : facilities.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-gray-500 text-lg">
                  条件に合う医療機関が見つかりませんでした。
                </p>
              </CardContent>
            </Card>
          ) : (
            facilities.map((facility, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-6">
                    {facility.official_name}
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <div className="w-6 flex-shrink-0">
                        <MapPin className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-gray-700 text-lg">{facility.address}</p>
                    </div>

                    {facility.homepage && (
                      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                        <div className="w-6 flex-shrink-0">
                          <Globe className="w-6 h-6 text-gray-500" />
                        </div>
                        <a
                          href={facility.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-lg"
                        >
                          ホームページ
                        </a>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 flex-shrink-0">
                          <Clock className="w-6 h-6 text-gray-500" />
                        </div>
                        <span className="font-semibold text-lg">診療日</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => {
                          const isOpen = [
                            facility.is_open_mon,
                            facility.is_open_tue,
                            facility.is_open_wed,
                            facility.is_open_thu,
                            facility.is_open_fri,
                            facility.is_open_sat,
                            facility.is_open_sun,
                          ][index]
                          return (
                            <div key={day} className={`text-center p-2 rounded ${isOpen ? 'bg-primary/10' : 'bg-gray-200'}`}>
                              <div className="font-semibold text-gray-700">{day}</div>
                              <div className={`text-lg ${isOpen ? 'text-primary font-medium' : 'text-gray-500'}`}>
                                {isOpen ? '〇' : '休'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <div className="flex justify-center gap-4 mt-12">
        <Link href="/">
          <Button variant="outline" className="text-lg px-8 py-6">
            トップページへ戻る
          </Button>
        </Link>
      </div>
    </div>
  )
} 