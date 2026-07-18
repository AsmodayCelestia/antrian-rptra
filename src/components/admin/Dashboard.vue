<template>
  <div class="p-6">
    <!-- Header -->
    <DashboardHeader
      :user="user"
      :is-moderator="isModerator"
      :is-admin="isAdmin"
      :is-staff="isStaff"
      :stats="stats"
    />

    <!-- Pendaftaran Manual -->
    <DashboardActions
      v-if="canEditAntrian"
      @open-kuota="openPilihKuotaModal"
      @open-csv="openCSVModal"
      @download-template="downloadCSVTemplate"
    />

    <!-- Filters -->
    <DashboardFilters
      v-model:tipe-kuota="filterTipeKuota"
      v-model:status="filterStatus"
      v-model:bulan="filterBulan"
      v-model:tahun="filterTahun"
      v-model:kartu="filterKartu"
      v-model:search="searchKKATM"
      :months="months"
      :tahun-options="tahunOptions"
      :kartu-options="kartuOptions"
      :can-edit="canEditAntrian"
      :paginated-count="paginatedRows.length"
      :filtered-count="filteredRows.length"
      @reset="resetFilters"
      @export="downloadExcel"
    />

    <!-- Table -->
    <DashboardTable
      :rows="paginatedRows"
      :can-edit="canEditAntrian"
      :current-page="currentPage"
      :per-page="perPage"
      :total-pages="totalPages"
      :pagination-start="paginationStart"
      :pagination-end="paginationEnd"
      :visible-pages="visiblePages"
      :filtered-count="filteredRows.length"
      @show-detail="showDetail"
      @download-qr="downloadQR"
      @open-wa="openWhatsApp"
      @open-edit="openEditModal"
      @update-status="updateStatus"
      @show-tolak="showTolakModal"
      @page-change="currentPage = $event"
      @per-page-change="perPage = $event; currentPage = 1"
    />

    <!-- Modals -->
    <DashboardModals
      :show-pilih-kuota="showPilihKuota"
      :csv-mode="csvMode"
      :kuota-list="kuotaList"
      :loading-kuota="loadingKuotaList"
      :selected-kuota="selectedKuota"
      :show-csv-upload="showCSVUploadModal"
      :csv-file="csvFile"
      :csv-preview="csvPreview"
      :csv-loading="csvLoading"
      :csv-results="csvResults"
      :detail-item="detailItem"
      :show-tolak-item="showTolakItem"
      :alasan-tolak="alasanTolak"
      :alasan-lainnya="alasanLainnya"
      :edit-item="editItem"
      :edit-form="editForm"
      :edit-errors="editErrors"
      :edit-error="editError"
      :edit-loading="editLoading"
      :kartu-options="kartuOptions"
      :can-edit="canEditAntrian"
      @close-pilih-kuota="closePilihKuota"
      @pilih-kuota="pilihKuota"
      @lanjut-form="lanjutKeForm"
      @lanjut-csv="lanjutKeCSVUpload"
      @close-csv-upload="closeCSVUploadModal"
      @close-csv-results="closeCSVResultsModal"
      @csv-file-change="handleCSVFileChange"
      @csv-ganti-file="csvFile = null; csvPreview = []"
      @submit-csv="submitCSVUpload"
      @download-csv-report="downloadCSVReport"
      @close-detail="closeDetail"
      @detail-download-qr="downloadQR"
      @detail-open-wa="openWhatsApp"
      @detail-verifikasi="(id) => { updateStatus(id, 'terverifikasi'); closeDetail() }"
      @detail-tolak="(item) => { showTolakModal(item); closeDetail() }"
      @close-edit="closeEditModal"
      @submit-edit="submitEdit"
      @update-alasan-tolak="alasanTolak = $event"
      @update-alasan-lainnya="alasanLainnya = $event"
      @close-tolak="closeTolakModal"
      @submit-tolak="submitTolak"
      @update-edit-form="editForm = $event"
    />
  </div>
</template>

<script setup>
import { useDashboard } from '../../composables/useDashboard'
import DashboardHeader from './dashboard/DashboardHeader.vue'
import DashboardActions from './dashboard/DashboardActions.vue'
import DashboardFilters from './dashboard/DashboardFilters.vue'
import DashboardTable from './dashboard/DashboardTable.vue'
import DashboardModals from './dashboard/DashboardModals.vue'

const {
  // User
  user, isModerator, isAdmin, isStaff, canEditAntrian,
  // Filters
  filterTipeKuota, filterStatus, filterBulan, filterTahun, filterKartu, searchKKATM,
  months, tahunOptions, kartuOptions, resetFilters,
  // Data
  antrianList, kuotaAktif, filteredRows, paginatedRows, stats,
  // Pagination
  currentPage, perPage, totalPages, paginationStart, paginationEnd, visiblePages,
  // Modals
  showPilihKuota, kuotaList, loadingKuotaList, selectedKuota,
  csvMode, showCSVUploadModal, csvFile, csvPreview, csvLoading, csvResults,
  detailItem, showTolakItem, alasanTolak, alasanLainnya,
  editItem, editForm, editErrors, editError, editLoading,
  // Methods
  openPilihKuotaModal, openCSVModal, closePilihKuota, pilihKuota,
  lanjutKeForm, lanjutKeCSVUpload, closeCSVUploadModal, closeCSVResultsModal,
  handleCSVFileChange, submitCSVUpload, downloadCSVTemplate, downloadCSVReport,
  showDetail, closeDetail, downloadQR, openWhatsApp,
  openEditModal, closeEditModal, submitEdit,
  updateStatus, showTolakModal, closeTolakModal, submitTolak,
  downloadExcel
} = useDashboard()
</script>