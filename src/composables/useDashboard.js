import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { user, isModerator, canEditAntrian } from './useAuth'
import { getAllAntrian, updateStatusAntrian, getKuotaAktif, updateAntrian } from './useAntrian'
import { getAllKuota } from './useKuota'
import { formatWIB } from '../lib/supabase'
import useCSVUpload from './useCSVUpload'
import QRCode from 'qrcode'
import { uploadQR } from '../lib/cloudinary'
import { supabase } from '../lib/supabase'

export function useDashboard() {
  const router = useRouter()

  // ========== STATE ==========
  const antrianList = ref([])
  const kuotaAktif = ref(null)

  const filterTipeKuota = ref('all')
  const filterBulan = ref(new Date().getMonth() + 1)
  const filterTahun = ref(new Date().getFullYear())
  const filterKartu = ref('')
  const filterStatus = ref('all')
  const searchKKATM = ref('')

  const currentPage = ref(1)
  const perPage = ref(20)

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  // ========== MODAL STATE ==========
  const showPilihKuota = ref(false)
  const kuotaList = ref([])
  const loadingKuotaList = ref(false)
  const selectedKuota = ref(null)
  const detailItem = ref(null)
  const showTolakItem = ref(null)
  const alasanTolak = ref('')
  const alasanLainnya = ref('')

  const editItem = ref(null)
  const editForm = ref({})
  const editErrors = ref({})
  const editError = ref('')
  const editLoading = ref(false)

  const csvMode = ref(false)
  const showCSVUploadModal = ref(false)
  const csvFile = ref(null)
  const csvPreview = ref([])

  const {
    loading: csvLoading,
    results: csvResults,
    processCSV,
    downloadTemplate,
    resetResults,
    validateRow
  } = useCSVUpload()

  // ========== COMPUTED ==========
  const tahunOptions = computed(() => {
    const current = new Date().getFullYear()
    return [current - 1, current, current + 1]
  })

  const kartuOptions = ['KJP', 'PJLP', 'Kartu Anak Jakarta', 'Kartu Lansia Jakarta', 'Kartu Disabilitas', 'PKK', 'Daswisma', 'Kartu Pekerja Jakarta', 'Guru Non PNS']

  const filteredRows = computed(() => {
    let result = [...antrianList.value]

    if (filterTipeKuota.value !== 'all') {
      result = result.filter(item => item.kuota_bulanan?.tipe_kuota === filterTipeKuota.value)
    }

    if (filterStatus.value !== 'all') {
      result = result.filter(item => item.status === filterStatus.value)
    }

    result = result.filter(item => {
      const date = new Date(item.created_at)
      return date.getMonth() + 1 === filterBulan.value && date.getFullYear() === filterTahun.value
    })

    if (filterKartu.value) {
      result = result.filter(item => item.kartu_pemanfaat === filterKartu.value)
    }

    if (searchKKATM.value) {
    const raw = searchKKATM.value.trim().toLowerCase()
    const q = raw.replace(/\D/g, '')
    result = result.filter(item => {
        const matchNama = item.nama_pemilik_atm?.toLowerCase().includes(raw)
        if (!q) return matchNama
        return matchNama ||
        (item.nomor_kk && item.nomor_kk.includes(q)) ||
        (item.nomor_atm && item.nomor_atm.includes(q))
    })
    }

    return result
  })

  const paginatedRows = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
    return filteredRows.value.slice(start, start + perPage.value)
  })

  const totalPages = computed(() => Math.ceil(filteredRows.value.length / perPage.value) || 1)
  const paginationStart = computed(() => filteredRows.value.length > 0 ? (currentPage.value - 1) * perPage.value + 1 : 0)
  const paginationEnd = computed(() => Math.min(currentPage.value * perPage.value, filteredRows.value.length))

  const visiblePages = computed(() => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages.value, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  })

  const stats = computed(() => ({
    total: filteredRows.value.length,
    menunggu: filteredRows.value.filter(d => d.status === 'menunggu').length,
    terverifikasi: filteredRows.value.filter(d => d.status === 'terverifikasi').length,
    ditolak: filteredRows.value.filter(d => d.status === 'ditolak').length,
    selesai: filteredRows.value.filter(d => d.status === 'selesai').length
  }))

  // ========== WATCH ==========
  watch([filterBulan, filterTahun, filterKartu, searchKKATM, filterTipeKuota, filterStatus], () => {
    currentPage.value = 1
  })

  // ========== HELPERS ==========
  const verifyDetailAccess = (item) => {
    if (isModerator.value) return true
    return item.rptra_id === user.value?.rptra_id
  }

  const statusClass = (status) => ({
    'menunggu': 'bg-yellow-100 text-yellow-700',
    'terverifikasi': 'bg-blue-100 text-blue-700',
    'ditolak': 'bg-red-100 text-red-700',
    'selesai': 'bg-green-100 text-green-700',
    'batal': 'bg-gray-100 text-gray-500'
  }[status])

  const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    return formatWIB(timestamp)
  }

  const formatMonthYear = (bulan, tahun) => {
    return `${months[bulan - 1]} ${tahun}`
  }

  const formatMonthYearFromItem = (item) => {
    if (!item.kuota_bulanan) return '-'
    return formatMonthYear(item.kuota_bulanan.bulan, item.kuota_bulanan.tahun)
  }

  // ========== FILTERS ==========
  const resetFilters = () => {
    const n = new Date()
    filterBulan.value = n.getMonth() + 1
    filterTahun.value = n.getFullYear()
    filterKartu.value = ''
    searchKKATM.value = ''
    filterTipeKuota.value = 'all'
    filterStatus.value = 'all'
    currentPage.value = 1
  }

  // ========== DATA FETCH ==========
  const fetchAntrian = async () => {
    try {
      const [antrian, kuota] = await Promise.all([
        getAllAntrian(),
        getKuotaAktif(user.value?.rptra_id)
      ])
      antrianList.value = antrian
      kuotaAktif.value = kuota
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }

  // ========== KUOTA MODAL ==========
  const openPilihKuotaModal = async () => {
    csvMode.value = false
    showPilihKuota.value = true
    loadingKuotaList.value = true
    selectedKuota.value = null
    try {
      const result = await getAllKuota(user.value?.rptra_id)
      kuotaList.value = (result || []).sort((a, b) => {
        const sisaA = a.kuota - (a.terdaftar || 0)
        const sisaB = b.kuota - (b.terdaftar || 0)
        if (sisaA > 0 && sisaB <= 0) return -1
        if (sisaA <= 0 && sisaB > 0) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      })
    } catch (err) {
      alert('Gagal memuat kuota')
    } finally {
      loadingKuotaList.value = false
    }
  }

  const openCSVModal = async () => {
    csvMode.value = true
    showPilihKuota.value = true
    loadingKuotaList.value = true
    selectedKuota.value = null
    csvFile.value = null
    csvPreview.value = []
    resetResults()

    try {
      const result = await getAllKuota(user.value?.rptra_id)
      kuotaList.value = (result || []).sort((a, b) => {
        const sisaA = a.kuota - (a.terdaftar || 0)
        const sisaB = b.kuota - (b.terdaftar || 0)
        if (sisaA > 0 && sisaB <= 0) return -1
        if (sisaA <= 0 && sisaB > 0) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      })
    } catch (err) {
      alert('Gagal memuat kuota')
    } finally {
      loadingKuotaList.value = false
    }
  }

  const closePilihKuota = () => {
    showPilihKuota.value = false
    selectedKuota.value = null
    csvMode.value = false
  }

  const pilihKuota = (k) => { selectedKuota.value = k }

  const lanjutKeForm = () => {
    if (!selectedKuota.value) return
    showPilihKuota.value = false
    router.push(`/admin/didaftarkanmanualbyadmin/${selectedKuota.value.id}`)
  }

  const lanjutKeCSVUpload = () => {
    if (!selectedKuota.value) return
    showPilihKuota.value = false
    showCSVUploadModal.value = true
  }

  // ========== CSV UPLOAD ==========
  const closeCSVUploadModal = () => {
    showCSVUploadModal.value = false
    csvFile.value = null
    csvPreview.value = []
    selectedKuota.value = null
    csvMode.value = false
  }

  const closeCSVResultsModal = () => {
    resetResults()
    csvFile.value = null
    csvPreview.value = []
    selectedKuota.value = null
    csvMode.value = false
  }

  const handleCSVFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5MB.')
      event.target.value = ''
      return
    }

    if (!file.name.endsWith('.csv')) {
      alert('File harus format CSV')
      event.target.value = ''
      return
    }

    csvFile.value = file

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.trim().split('\n')
        if (lines.length < 2) {
          alert('CSV kosong atau tidak valid')
          csvFile.value = null
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

        csvPreview.value = lines.slice(1, 6).map((line, index) => {
          const values = []
          let current = ''
          let inQuotes = false

          for (let char of line) {
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          values.push(current.trim())

          const rowData = {}
          headers.forEach((h, i) => {
            rowData[h] = values[i] ? values[i].replace(/"/g, '').trim() : ''
          })

          const validation = validateRow(rowData, index)
          return {
            ...validation,
            raw: rowData
          }
        })
      } catch (err) {
        console.error('Preview error:', err)
        alert('Gagal membaca file CSV')
        csvFile.value = null
        csvPreview.value = []
      }
    }
    reader.readAsText(file)
  }

  const submitCSVUpload = async () => {
    if (!csvFile.value || !selectedKuota.value) return

    try {
      await processCSV(csvFile.value, selectedKuota.value.id, user.value?.rptra_id)
      await fetchAntrian()
      showCSVUploadModal.value = false
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const downloadCSVTemplate = () => {
    downloadTemplate()
  }

  const downloadCSVReport = () => {
    const reportData = csvResults.value.details.map(d => ({
      'Row': d.row,
      'Status': d.status === 'success' ? 'Sukses' : d.status === 'skipped' ? 'Skip (Duplikat)' : 'Gagal',
      'Nama': d.data?.nama_pemilik_atm || '-',
      'KK': d.data?.nomor_kk || '-',
      'Kartu': d.data?.kartu_pemanfaat || '-',
      'Keterangan': d.message
    }))

    const summary = [
      ['LAPORAN UPLOAD CSV'],
      [''],
      ['Periode', formatMonthYear(selectedKuota.value?.bulan, selectedKuota.value?.tahun)],
      ['Tipe Kuota', (selectedKuota.value?.tipe_kuota || 'umum').toUpperCase()],
      ['RPTRA', user.value?.rptra?.nama || '-'],
      ['Waktu Upload', new Date().toLocaleString('id-ID')],
      [''],
      ['Ringkasan'],
      ['Total Row', csvResults.value.total],
      ['Sukses', csvResults.value.success],
      ['Skip (Duplikat KK)', csvResults.value.skipped],
      ['Gagal', csvResults.value.failed],
      ['']
    ]

    const ws = XLSX.utils.aoa_to_sheet([
      ...summary,
      ['Row', 'Status', 'Nama', 'KK', 'Kartu', 'Keterangan'],
      ...reportData.map(r => [r.Row, r.Status, r.Nama, r.KK, r.Kartu, r.Keterangan])
    ])

    ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 40 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report Upload')

    const fileName = `Report_Upload_CSV_${new Date().getTime()}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // ========== EDIT ==========
  const openEditModal = (item) => {
    editItem.value = { ...item }
    editForm.value = {
      nama_pemilik_atm: item.nama_pemilik_atm,
      email: item.email || '',
      whatsapp: item.whatsapp,
      nomor_kk: item.nomor_kk,
      nomor_atm: item.nomor_atm,
      kartu_pemanfaat: item.kartu_pemanfaat,
      kelurahan: item.kelurahan,
      rt: item.rt,
      rw: item.rw,
      alamat: item.alamat
    }
    editErrors.value = {}
    editError.value = ''
  }

  const closeEditModal = () => {
    editItem.value = null
    editForm.value = {}
    editErrors.value = {}
    editError.value = ''
    editLoading.value = false
  }

  const validateEditForm = () => {
    const errors = {}

    if (!editForm.value.nama_pemilik_atm?.trim()) {
      errors.nama_pemilik_atm = 'Nama wajib diisi'
    }

    if (!editForm.value.whatsapp?.trim()) {
      errors.whatsapp = 'WhatsApp wajib diisi'
    }

    if (!editForm.value.nomor_kk?.trim()) {
      errors.nomor_kk = 'Nomor KK wajib diisi'
    } else if (editForm.value.nomor_kk.length < 16) {
      errors.nomor_kk = 'Nomor KK harus 16 digit'
    }

    if (!editForm.value.nomor_atm?.trim()) {
      errors.nomor_atm = 'Nomor ATM wajib diisi'
    } else if (editForm.value.nomor_atm.length < 16 || editForm.value.nomor_atm.length > 18) {
      errors.nomor_atm = 'Nomor ATM harus 16-18 digit'
    }

    if (!editForm.value.kartu_pemanfaat?.trim()) {
      errors.kartu_pemanfaat = 'Kartu pemanfaat wajib dipilih'
    }

    if (!editForm.value.kelurahan?.trim()) {
      errors.kelurahan = 'Kelurahan wajib diisi'
    }

    if (!editForm.value.rt?.trim()) {
      errors.rt = 'RT wajib diisi'
    }

    if (!editForm.value.rw?.trim()) {
      errors.rw = 'RW wajib diisi'
    }

    if (!editForm.value.alamat?.trim()) {
      errors.alamat = 'Alamat wajib diisi'
    }

    editErrors.value = errors
    return Object.keys(errors).length === 0
  }

  const submitEdit = async () => {
    if (!validateEditForm()) return

    editLoading.value = true
    editError.value = ''

    try {
      await updateAntrian(editItem.value.id, {
        nama_pemilik_atm: editForm.value.nama_pemilik_atm,
        email: editForm.value.email || null,
        whatsapp: editForm.value.whatsapp,
        nomor_kk: editForm.value.nomor_kk,
        nomor_atm: editForm.value.nomor_atm,
        kartu_pemanfaat: editForm.value.kartu_pemanfaat,
        kelurahan: editForm.value.kelurahan,
        rt: editForm.value.rt,
        rw: editForm.value.rw,
        alamat: editForm.value.alamat
      })

      await fetchAntrian()
      closeEditModal()

    } catch (err) {
      console.error('Edit error:', err)
      editError.value = 'Gagal menyimpan perubahan: ' + err.message
    } finally {
      editLoading.value = false
    }
  }

  // ========== DETAIL ==========
  const showDetail = (item) => {
    if (!verifyDetailAccess(item)) return
    detailItem.value = { ...item }
  }

  const closeDetail = () => { detailItem.value = null }

  // ========== QR ==========
  const downloadQR = async (item) => {
    try {
      const qrData = JSON.stringify({ nomor: item.nomor_antrian, kuota_id: item.kuota_id })
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, qrData, { width: 400, margin: 2 })
      const link = document.createElement('a')
      link.download = `QR-${item.nomor_antrian.toString().padStart(3, '0')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      alert('Gagal generate QR')
    }
  }

  // ========== WHATSAPP ==========
  const openWhatsApp = async (item) => {
    const phone = item.whatsapp?.replace(/\D/g, '')
    if (!phone) {
      alert('Nomor WhatsApp tidak valid')
      return
    }

    let formattedPhone = phone
    if (phone.startsWith('0')) {
      formattedPhone = '62' + phone.substring(1)
    } else if (!phone.startsWith('62')) {
      formattedPhone = '62' + phone
    }

    let qrUrl = item.qr_cloudinary_url

    if (!qrUrl) {
      try {
        const qrData = JSON.stringify({
          nomor: item.nomor_antrian,
          kuota_id: item.kuota_id
        })

        const canvas = document.createElement('canvas')
        await QRCode.toCanvas(canvas, qrData, { width: 400, margin: 2 })

        const dataUrl = canvas.toDataURL('image/png')
        const uploadResult = await uploadQR(dataUrl, `antrian-${item.id}`)

        qrUrl = uploadResult.secure_url

        await supabase
          .from('antrian')
          .update({ qr_cloudinary_url: qrUrl })
          .eq('id', item.id)

      } catch (err) {
        alert('Gagal upload QR: ' + err.message)
        return
      }
    }

    const message = encodeURIComponent(
      `Halo ${item.nama_pemilik_atm},\n\n` +
      `Pendaftaran Anda di *${item.rptra?.nama || 'RPTRA'}* telah berhasil!\n\n` +
      `📋 *Detail Pendaftaran:*\n` +
      `• Nomor Antrian: *#${item.nomor_antrian?.toString().padStart(3, '0')}*\n` +
      `• Kartu: ${item.kartu_pemanfaat}\n` +
      `• Kelurahan: ${item.kelurahan}\n` +
      `• Jenis Kuota: ${(item.kuota_bulanan?.tipe_kuota || 'umum').toUpperCase()}\n\n` +
      `🔗 *Link QR Code:*\n${qrUrl}\n\n` +
      `⏰ *Jadwal Pengambilan:*\n` +
      `Hari berikutnya (H+1) pukul 08.00 - 11.00 WIB\n\n` +
      `⚠️ *Catatan Penting:*\n` +
      `• Tunjukkan QR code saat pengambilan\n` +
      `• Bawa Kartu ATM, Fotokopi KK dan KTP asli\n` +
      `• Nomor antrian tidak dapat dipindahtangankan\n\n` +
      `Terima kasih.`
    )

    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
  }

  // ========== STATUS UPDATE ==========
  const updateStatus = async (id, status) => {
    try {
      await updateStatusAntrian(id, status)
      await fetchAntrian()
    } catch (err) {
      alert('Gagal update status')
    }
  }

  const showTolakModal = (item) => {
    showTolakItem.value = item
    alasanTolak.value = ''
    alasanLainnya.value = ''
  }

  const closeTolakModal = () => {
    showTolakItem.value = null
    alasanTolak.value = ''
    alasanLainnya.value = ''
  }

  const submitTolak = async () => {
    if (!showTolakItem.value) return
    const alasan = alasanTolak.value === 'Lainnya' ? alasanLainnya.value : alasanTolak.value
    try {
      await updateStatusAntrian(showTolakItem.value.id, 'ditolak', alasan)
      closeTolakModal()
      await fetchAntrian()
    } catch (err) {
      alert('Gagal menolak')
    }
  }

  // ========== EXCEL EXPORT ==========
  const downloadExcel = () => {
    const tipeLabel = filterTipeKuota.value === 'all' ? 'Semua Tipe' : filterTipeKuota.value.toUpperCase()

    const data = filteredRows.value.map(item => ({
      'No Antrian': `#${item.nomor_antrian?.toString().padStart(3, '0')}`,
      'Nama Pemilik ATM': item.nama_pemilik_atm,
      'Email': item.email || '-',
      'WhatsApp': item.whatsapp,
      'Nomor KK': `'${item.nomor_kk}`,
      'Nomor ATM': `'${item.nomor_atm}`,
      'Kelurahan': item.kelurahan,
      'RT': item.rt,
      'RW': item.rw,
      'Alamat Lengkap': item.alamat,
      'Kartu Pemanfaat': item.kartu_pemanfaat,
      'Jenis Kuota': (item.kuota_bulanan?.tipe_kuota || 'umum').toUpperCase(),
      'Status': item.status?.toUpperCase(),
      'Alasan Ditolak': item.alasan_ditolak || '-',
      'Waktu Daftar': formatTime(item.created_at),
      'RPTRA': item.rptra?.nama || '-'
    }))

    const wb = XLSX.utils.book_new()
    const wsData = XLSX.utils.json_to_sheet(data)

    const headerRows = [
      ['LAPORAN ANTRIAN RPTRA - DATA LENGKAP'],
      [''],
      [`Periode: ${months[filterBulan.value - 1]} ${filterTahun.value}`],
      [`Tipe Kuota: ${tipeLabel}`],
      [`RPTRA: ${!isModerator.value && user.value?.rptra ? user.value.rptra.nama : 'Semua RPTRA (Moderator)'}`],
      [`Dicetak: ${new Date().toLocaleString('id-ID')} | Total Data: ${filteredRows.value.length}`],
      ['']
    ]

    const ws = XLSX.utils.aoa_to_sheet([
      ...headerRows,
      ...XLSX.utils.sheet_to_json(wsData, { header: 1 })
    ])

    const range = XLSX.utils.decode_range(ws['!ref'])

    ws['A1'].s = { font: { bold: true, size: 16, color: { rgb: '1E40AF' } } }
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }]

    const headerRowIndex = 7
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + headerRowIndex
      if (!ws[address]) continue
      ws[address].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, size: 10 },
        fill: { fgColor: { rgb: '2563EB' }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }

    ws['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 5 },
      { wch: 5 }, { wch: 35 }, { wch: 20 }, { wch: 12 },
      { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 20 }
    ]

    ws['!freeze'] = { xSplit: 0, ySplit: 7 }
    XLSX.utils.book_append_sheet(wb, ws, 'Data Lengkap')

    const summaryData = [
      ['RINGKASAN LAPORAN'],
      [''],
      ['Informasi Umum'],
      ['Periode', `${months[filterBulan.value - 1]} ${filterTahun.value}`],
      ['Tipe Kuota', tipeLabel],
      ['RPTRA', !isModerator.value && user.value?.rptra ? user.value.rptra.nama : 'Semua RPTRA (Moderator)'],
      ['Total Data', filteredRows.value.length],
      [''],
      ['Status Breakdown'],
      ['Menunggu', filteredRows.value.filter(d => d.status === 'menunggu').length],
      ['Terverifikasi', filteredRows.value.filter(d => d.status === 'terverifikasi').length],
      ['Selesai', filteredRows.value.filter(d => d.status === 'selesai').length],
      ['Ditolak', filteredRows.value.filter(d => d.status === 'ditolak').length],
      ['Batal', filteredRows.value.filter(d => d.status === 'batal').length],
      [''],
      ['Dicetak', new Date().toLocaleString('id-ID')]
    ]

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['A1'].s = { font: { bold: true, size: 14, color: { rgb: '1E40AF' } } }
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

    const fileName = `Laporan_Antrian_${months[filterBulan.value - 1]}_${filterTahun.value}_${tipeLabel.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // ========== LIFECYCLE ==========
  onMounted(fetchAntrian)

  // ========== RETURN ==========
  return {
    // User
    user,
    isModerator,
    canEditAntrian,

    // Filters
    filterTipeKuota,
    filterBulan,
    filterTahun,
    filterKartu,
    filterStatus,
    searchKKATM,
    months,
    tahunOptions,
    kartuOptions,
    resetFilters,

    // Data
    antrianList,
    kuotaAktif,
    filteredRows,
    paginatedRows,
    stats,

    // Pagination
    currentPage,
    perPage,
    totalPages,
    paginationStart,
    paginationEnd,
    visiblePages,

    // Modal State
    showPilihKuota,
    kuotaList,
    loadingKuotaList,
    selectedKuota,
    csvMode,
    showCSVUploadModal,
    csvFile,
    csvPreview,
    csvLoading,
    csvResults,
    detailItem,
    showTolakItem,
    alasanTolak,
    alasanLainnya,
    editItem,
    editForm,
    editErrors,
    editError,
    editLoading,

    // Methods
    fetchAntrian,
    openPilihKuotaModal,
    openCSVModal,
    closePilihKuota,
    pilihKuota,
    lanjutKeForm,
    lanjutKeCSVUpload,
    closeCSVUploadModal,
    closeCSVResultsModal,
    handleCSVFileChange,
    submitCSVUpload,
    downloadCSVTemplate,
    downloadCSVReport,
    showDetail,
    closeDetail,
    downloadQR,
    openWhatsApp,
    openEditModal,
    closeEditModal,
    submitEdit,
    updateStatus,
    showTolakModal,
    closeTolakModal,
    submitTolak,
    downloadExcel,

    // Helpers
    statusClass,
    formatTime,
    formatMonthYear,
    formatMonthYearFromItem
  }
}