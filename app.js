// ============================================================
// AFK Influencer ROI Calculator
// ============================================================

// --- Tab Switching ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ============================================================
// NUMBER FORMATTING HELPERS
// ============================================================

// Format number with thousand separators
function formatNumberWithCommas(value) {
  if (!value) return '';
  const num = parseFloat(value.toString().replace(/,/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
}

// Parse number from formatted string (remove commas)
function parseFormattedNumber(value) {
  if (!value) return 0;
  return parseFloat(value.toString().replace(/,/g, '')) || 0;
}

// Add formatting to all number input fields
document.querySelectorAll('.formatted-number').forEach(input => {
  input.addEventListener('blur', function() {
    const rawValue = this.value.replace(/,/g, '');
    if (rawValue && !isNaN(parseFloat(rawValue))) {
      this.value = formatNumberWithCommas(rawValue);
    }
  });

  input.addEventListener('focus', function() {
    // Keep formatted for easier reading
  });

  input.addEventListener('input', function() {
    // Trigger calculation on input
    const event = new Event('calculate');
    this.dispatchEvent(event);
  });
});

// ============================================================
// INFLUENCER ROI CALCULATOR
// ============================================================

// --- Platform Switching ---
const platformSelect = document.getElementById('platform');
const twitchFields = document.getElementById('twitch-fields');
const youtubeFields = document.getElementById('youtube-fields');
const tiktokFields = document.getElementById('tiktok-fields');

platformSelect.addEventListener('change', () => {
  const platform = platformSelect.value;

  twitchFields.classList.add('hidden');
  youtubeFields.classList.add('hidden');
  tiktokFields.classList.add('hidden');

  if (platform === 'Twitch') {
    twitchFields.classList.remove('hidden');
  } else if (platform === 'YouTube') {
    youtubeFields.classList.remove('hidden');
  } else if (platform === 'TikTok') {
    tiktokFields.classList.remove('hidden');
  }
});

// --- Twitch Auto-Calculations ---
const twitchACCV = document.getElementById('twitch-accv');
const twitchHoursStreamed = document.getElementById('twitch-hours-streamed');
const twitchHoursWatched = document.getElementById('twitch-hours-watched');
const twitchTotalViews = document.getElementById('twitch-total-views');
const twitchEMV = document.getElementById('twitch-emv');
const twitchCreatorRate = document.getElementById('twitch-creator-rate');
const twitchROI = document.getElementById('twitch-roi');
const twitchROIGroup = document.getElementById('twitch-roi-group');

function calculateTwitchMetrics() {
  const accv = parseFormattedNumber(twitchACCV.value);
  const hoursStreamed = parseFormattedNumber(twitchHoursStreamed.value);
  const creatorRate = parseFormattedNumber(twitchCreatorRate.value);

  // Total Hours Watched = ACCV * Total Hours Streamed
  const hoursWatched = accv * hoursStreamed;

  // Total Views = Total Hours Watched * 12
  const totalViews = hoursWatched * 12;

  // Estimated Media Value = Total Hours Watched * $1.2 USD
  const emv = hoursWatched * 1.2;

  // Display calculated values
  twitchHoursWatched.value = hoursWatched.toLocaleString('en-US', { maximumFractionDigits: 1 });
  twitchTotalViews.value = totalViews.toLocaleString('en-US', { maximumFractionDigits: 0 });
  twitchEMV.value = '$' + emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';

  // Show/hide ROI field and calculate if Creator Rate is provided
  if (creatorRate > 0) {
    twitchROIGroup.style.display = 'block';
    const roi = emv / creatorRate;
    const roiClass = roi >= 1 ? 'positive' : 'negative';
    twitchROI.value = roi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    twitchROI.className = 'calculated-field result-field ' + roiClass;
  } else {
    twitchROIGroup.style.display = 'none';
    twitchROI.value = '';
  }
}

twitchACCV.addEventListener('input', calculateTwitchMetrics);
twitchHoursStreamed.addEventListener('input', calculateTwitchMetrics);
twitchCreatorRate.addEventListener('input', calculateTwitchMetrics);

// --- YouTube Auto-Calculations ---
const youtubeViews = document.getElementById('youtube-views');
const youtubeCreatorRate = document.getElementById('youtube-creator-rate');
const youtubeEMV = document.getElementById('youtube-emv');
const youtubeROI = document.getElementById('youtube-roi');
const youtubeROIGroup = document.getElementById('youtube-roi-group');
const youtubeCPM = document.getElementById('youtube-cpm');
const youtubeCPMGroup = document.getElementById('youtube-cpm-group');
const youtubeEngagement = document.getElementById('youtube-engagement');
const youtubeEngagementRate = document.getElementById('youtube-engagement-rate');
const youtubeEngagementRateGroup = document.getElementById('youtube-engagement-rate-group');

function calculateYouTubeMetrics() {
  const views = parseFormattedNumber(youtubeViews.value);
  const creatorRate = parseFormattedNumber(youtubeCreatorRate.value);
  const engagement = parseFormattedNumber(youtubeEngagement.value);

  // EMV = Total Views * $100 / 1000
  const emv = views * 0.1;

  youtubeEMV.value = '$' + emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';

  if (creatorRate > 0 && views > 0) {
    youtubeROIGroup.style.display = 'block';
    youtubeCPMGroup.style.display = 'block';

    const roi = emv / creatorRate;
    const roiClass = roi >= 1 ? 'positive' : 'negative';
    youtubeROI.value = roi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    youtubeROI.className = 'calculated-field result-field ' + roiClass;

    const cpm = (creatorRate / views) * 1000;
    youtubeCPM.value = '$' + cpm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  } else {
    youtubeROIGroup.style.display = 'none';
    youtubeCPMGroup.style.display = 'none';
    youtubeROI.value = '';
    youtubeCPM.value = '';
  }

  if (engagement > 0 && views > 0) {
    youtubeEngagementRateGroup.style.display = 'block';
    const engagementRate = (engagement / views) * 100;
    youtubeEngagementRate.value = engagementRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  } else {
    youtubeEngagementRateGroup.style.display = 'none';
    youtubeEngagementRate.value = '';
  }
}

youtubeViews.addEventListener('input', calculateYouTubeMetrics);
youtubeCreatorRate.addEventListener('input', calculateYouTubeMetrics);
youtubeEngagement.addEventListener('input', calculateYouTubeMetrics);

// --- TikTok Auto-Calculations ---
const tiktokViews = document.getElementById('tiktok-views');
const tiktokCreatorRate = document.getElementById('tiktok-creator-rate');
const tiktokEMV = document.getElementById('tiktok-emv');
const tiktokROI = document.getElementById('tiktok-roi');
const tiktokROIGroup = document.getElementById('tiktok-roi-group');
const tiktokCPM = document.getElementById('tiktok-cpm');
const tiktokCPMGroup = document.getElementById('tiktok-cpm-group');
const tiktokEngagement = document.getElementById('tiktok-engagement');
const tiktokEngagementRate = document.getElementById('tiktok-engagement-rate');
const tiktokEngagementRateGroup = document.getElementById('tiktok-engagement-rate-group');

function calculateTikTokMetrics() {
  const views = parseFormattedNumber(tiktokViews.value);
  const creatorRate = parseFormattedNumber(tiktokCreatorRate.value);
  const engagement = parseFormattedNumber(tiktokEngagement.value);

  // EMV = Total Views * $30 / 1000
  const emv = views * 0.03;

  tiktokEMV.value = '$' + emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';

  if (creatorRate > 0 && views > 0) {
    tiktokROIGroup.style.display = 'block';
    tiktokCPMGroup.style.display = 'block';

    const roi = emv / creatorRate;
    const roiClass = roi >= 1 ? 'positive' : 'negative';
    tiktokROI.value = roi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    tiktokROI.className = 'calculated-field result-field ' + roiClass;

    const cpm = (creatorRate / views) * 1000;
    tiktokCPM.value = '$' + cpm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  } else {
    tiktokROIGroup.style.display = 'none';
    tiktokCPMGroup.style.display = 'none';
    tiktokROI.value = '';
    tiktokCPM.value = '';
  }

  if (engagement > 0 && views > 0) {
    tiktokEngagementRateGroup.style.display = 'block';
    const engagementRate = (engagement / views) * 100;
    tiktokEngagementRate.value = engagementRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  } else {
    tiktokEngagementRateGroup.style.display = 'none';
    tiktokEngagementRate.value = '';
  }
}

tiktokViews.addEventListener('input', calculateTikTokMetrics);
tiktokCreatorRate.addEventListener('input', calculateTikTokMetrics);
tiktokEngagement.addEventListener('input', calculateTikTokMetrics);

// ============================================================
// CSV TEMPLATE DOWNLOADS
// ============================================================

document.getElementById('download-twitch-template').addEventListener('click', () => {
  const template = `creator_name,country,language,genre,accv,hours_streamed,creator_rate`;
  downloadFile(template, 'twitch_campaign_template.csv', 'text/csv');
});

document.getElementById('download-youtube-template').addEventListener('click', () => {
  const template = `creator_name,country,language,genre,total_views,creator_rate,engagement`;
  downloadFile(template, 'youtube_campaign_template.csv', 'text/csv');
});

document.getElementById('download-tiktok-template').addEventListener('click', () => {
  const template = `creator_name,country,language,genre,total_views,creator_rate,engagement`;
  downloadFile(template, 'tiktok_campaign_template.csv', 'text/csv');
});

// ============================================================
// CAMPAIGN REPORT GENERATION
// ============================================================

const reportDropZone = document.getElementById('report-drop-zone');
const reportCsvInput = document.getElementById('report-csv-input');
const uploadedFileInfo = document.getElementById('uploaded-file-info');
const uploadedFileName = document.getElementById('uploaded-file-name');
const removeFileBtn = document.getElementById('remove-file');
const deliverReportBtn = document.getElementById('deliver-report');
const campaignReport = document.getElementById('campaign-report');

let uploadedFile = null;

reportDropZone.addEventListener('click', () => reportCsvInput.click());

reportDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  reportDropZone.classList.add('dragover');
});

reportDropZone.addEventListener('dragleave', () => {
  reportDropZone.classList.remove('dragover');
});

reportDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  reportDropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) {
    handleFileUpload(file);
  }
});

reportCsvInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFileUpload(file);
});

function handleFileUpload(file) {
  uploadedFile = file;
  uploadedFileName.textContent = file.name;
  uploadedFileInfo.classList.remove('hidden');
  reportDropZone.style.display = 'none';
  deliverReportBtn.disabled = false;
}

removeFileBtn.addEventListener('click', () => {
  uploadedFile = null;
  uploadedFileInfo.classList.add('hidden');
  reportDropZone.style.display = 'block';
  deliverReportBtn.disabled = true;
  reportCsvInput.value = '';
});

deliverReportBtn.addEventListener('click', () => {
  if (!uploadedFile) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawRows = parseCSV(e.target.result);
    if (rawRows.length === 0) {
      alert('No data found in CSV. Please check the format.');
      return;
    }

    // Detect platform from CSV columns
    const platform = detectPlatform(rawRows[0]);
    const processedData = processCreatorData(rawRows, platform);

    // Generate campaign name from filename
    const campaignName = uploadedFile.name.replace('.csv', '').replace(/_/g, ' ');

    generateCampaignReport(processedData, campaignName, platform);
  };
  reader.readAsText(uploadedFile);
});

function detectPlatform(row) {
  if (row.accv !== undefined || row.hours_streamed !== undefined) {
    return 'Twitch';
  } else if (row.total_views !== undefined) {
    // Check if it's TikTok or YouTube based on filename or default
    return 'YouTube'; // Will be determined by context
  }
  return 'Unknown';
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h =>
    h.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_')
  );

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

function processCreatorData(rows, platform) {
  // Helper to parse numbers that may have commas
  const parseNum = (val) => {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
  };

  return rows.map(row => {
    const creatorRate = parseNum(row.creator_rate);
    const engagement = parseNum(row.engagement);

    let views = 0;
    let hoursWatched = 0;
    let emv = 0;

    // Detect platform from row data
    const isTwitch = row.accv !== undefined && row.accv !== '';

    if (isTwitch) {
      // Twitch calculations
      const accv = parseNum(row.accv);
      const hoursStreamed = parseNum(row.hours_streamed);
      hoursWatched = accv * hoursStreamed;
      views = hoursWatched * 12;
      emv = hoursWatched * 1.2;
    } else if (row.total_views !== undefined) {
      views = parseNum(row.total_views);
      // Detect if TikTok or YouTube based on filename
      if (uploadedFile && uploadedFile.name.toLowerCase().includes('tiktok')) {
        emv = views * 0.03; // $30 per 1000 views
      } else {
        emv = views * 0.1; // $100 per 1000 views
      }
    }

    const roi = creatorRate > 0 ? emv / creatorRate : 0;
    const cpm = views > 0 && creatorRate > 0 ? (creatorRate / views) * 1000 : 0;
    const engagementRate = views > 0 && engagement > 0 ? (engagement / views) * 100 : 0;

    return {
      creator_name: row.creator_name || 'Unknown',
      country: row.country || 'N/A',
      language: row.language || 'N/A',
      genre: row.genre || 'N/A',
      views: Math.round(views * 100) / 100,
      hours_watched: Math.round(hoursWatched * 100) / 100,
      creator_rate: Math.round(creatorRate * 100) / 100,
      engagement: Math.round(engagement * 100) / 100,
      emv: Math.round(emv * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      cpm: Math.round(cpm * 100) / 100,
      engagement_rate: Math.round(engagementRate * 100) / 100,
      is_twitch: isTwitch
    };
  });
}

function generateCampaignReport(data, campaignName, platform) {
  campaignReport.classList.remove('hidden');
  document.querySelector('.report-upload-section').style.display = 'none';

  // Detect if this is a Twitch campaign
  const isTwitchCampaign = data.length > 0 && data[0].is_twitch;

  // Set campaign title
  document.getElementById('campaign-title').textContent = campaignName;
  document.getElementById('report-date').textContent =
    'Generated: ' + new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  // Calculate totals - sum all values
  const totals = data.reduce((acc, c) => ({
    creators: acc.creators + 1,
    totalCost: acc.totalCost + c.creator_rate,
    totalEMV: acc.totalEMV + c.emv,
    totalViews: acc.totalViews + c.views,
    totalEngagement: acc.totalEngagement + c.engagement
  }), { creators: 0, totalCost: 0, totalEMV: 0, totalViews: 0, totalEngagement: 0 });

  // Round totals to 2 decimal places
  totals.totalCost = Math.round(totals.totalCost * 100) / 100;
  totals.totalEMV = Math.round(totals.totalEMV * 100) / 100;
  totals.totalViews = Math.round(totals.totalViews * 100) / 100;

  // Overall Campaign ROI = Total EMV / Total Cost
  const overallROI = totals.totalCost > 0 ? Math.round((totals.totalEMV / totals.totalCost) * 100) / 100 : 0;

  // Build summary cards - exclude engagement rate for Twitch
  const summaryCards = [
    { label: 'Total Creators', value: totals.creators.toLocaleString(), type: '' },
    { label: 'Total Cost', value: '$' + totals.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), type: '' },
    { label: 'Total EMV', value: '$' + totals.totalEMV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), type: 'highlight' },
    { label: 'Total Views', value: totals.totalViews.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }), type: '' },
    { label: 'Overall Campaign ROI', value: overallROI.toFixed(2) + 'x', type: overallROI >= 1 ? 'highlight' : 'warn' },
  ];

  // Only add engagement rate for non-Twitch campaigns
  if (!isTwitchCampaign) {
    const avgEngagementRate = totals.totalViews > 0 ? Math.round((totals.totalEngagement / totals.totalViews) * 10000) / 100 : 0;
    summaryCards.push({ label: 'Avg Engagement Rate', value: avgEngagementRate.toFixed(2) + '%', type: '' });
  }

  const summaryHTML = summaryCards.map(card => `
    <div class="summary-card ${card.type}">
      <div class="card-label">${card.label}</div>
      <div class="card-value">${card.value}</div>
    </div>
  `).join('');

  document.getElementById('summary-cards').innerHTML = summaryHTML;

  // Generate insights
  generateInsights(data, totals, isTwitchCampaign);

  // Build table
  buildReportTable(data, isTwitchCampaign);

  // Draw charts
  drawReportCharts(data);

  // Store for export
  window._reportData = data;
  window._isTwitchCampaign = isTwitchCampaign;
}

function generateInsights(data, totals, isTwitchCampaign) {
  const insights = [];

  // Top performer by EMV
  const topByEMV = data.reduce((max, c) => c.emv > max.emv ? c : max, data[0]);
  insights.push({
    type: 'top-performer',
    title: 'Top Performer (EMV)',
    value: topByEMV.creator_name,
    detail: '$' + topByEMV.emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EMV'
  });

  // Best ROI
  const topByROI = data.filter(c => c.roi > 0).reduce((max, c) => c.roi > max.roi ? c : max, data[0]);
  if (topByROI && topByROI.roi > 0) {
    insights.push({
      type: 'top-performer',
      title: 'Best ROI',
      value: topByROI.creator_name,
      detail: topByROI.roi.toFixed(2) + 'x return on investment'
    });
  }

  // Best engagement rate - only for non-Twitch campaigns
  if (!isTwitchCampaign) {
    const engagementData = data.filter(c => c.engagement_rate > 0);
    if (engagementData.length > 0) {
      const topByEngagement = engagementData.reduce((max, c) => c.engagement_rate > max.engagement_rate ? c : max, engagementData[0]);
      insights.push({
        type: 'info',
        title: 'Highest Engagement',
        value: topByEngagement.creator_name,
        detail: topByEngagement.engagement_rate.toFixed(2) + '% engagement rate'
      });
    }
  }

  // Genre performance
  const genrePerformance = {};
  data.forEach(c => {
    if (!genrePerformance[c.genre]) {
      genrePerformance[c.genre] = { emv: 0, spend: 0, count: 0 };
    }
    genrePerformance[c.genre].emv += c.emv;
    genrePerformance[c.genre].spend += c.creator_rate;
    genrePerformance[c.genre].count++;
  });

  const bestGenre = Object.entries(genrePerformance)
    .filter(([genre]) => genre !== 'N/A')
    .map(([genre, data]) => ({ genre, roi: data.spend > 0 ? data.emv / data.spend : 0, emv: data.emv }))
    .sort((a, b) => b.roi - a.roi)[0];

  if (bestGenre) {
    insights.push({
      type: 'info',
      title: 'Best Performing Genre',
      value: bestGenre.genre,
      detail: bestGenre.roi.toFixed(2) + 'x ROI | $' + bestGenre.emv.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' EMV'
    });
  }

  // Country performance
  const countryPerformance = {};
  data.forEach(c => {
    if (!countryPerformance[c.country]) {
      countryPerformance[c.country] = { emv: 0, spend: 0, count: 0 };
    }
    countryPerformance[c.country].emv += c.emv;
    countryPerformance[c.country].spend += c.creator_rate;
    countryPerformance[c.country].count++;
  });

  const bestCountry = Object.entries(countryPerformance)
    .filter(([country]) => country !== 'N/A')
    .map(([country, data]) => ({ country, roi: data.spend > 0 ? data.emv / data.spend : 0, count: data.count }))
    .sort((a, b) => b.roi - a.roi)[0];

  if (bestCountry) {
    insights.push({
      type: 'info',
      title: 'Top Country by ROI',
      value: bestCountry.country,
      detail: bestCountry.roi.toFixed(2) + 'x ROI from ' + bestCountry.count + ' creator(s)'
    });
  }

  // Underperformers warning
  const underperformers = data.filter(c => c.roi > 0 && c.roi < 0.5);
  if (underperformers.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Underperforming Creators',
      value: underperformers.length + ' creator(s)',
      detail: 'ROI below 0.5x - consider reviewing partnership terms'
    });
  }

  const insightsHTML = insights.map(insight => `
    <div class="insight-card ${insight.type}">
      <div class="insight-title">${insight.title}</div>
      <div class="insight-value">${insight.value}</div>
      <div class="insight-detail">${insight.detail}</div>
    </div>
  `).join('');

  document.getElementById('insights-grid').innerHTML = insightsHTML;
}

function buildReportTable(data, isTwitchCampaign) {
  const thead = document.querySelector('#report-table thead');
  const tbody = document.querySelector('#report-table tbody');

  if (isTwitchCampaign) {
    // Twitch table - no engagement columns
    thead.innerHTML = `<tr>
      <th>Creator</th><th>Country</th><th>Language</th><th>Genre</th>
      <th>Hours Watched</th><th>Views</th><th>Creator Rate</th><th>EMV</th><th>ROI</th>
    </tr>`;

    tbody.innerHTML = data.map(c => `<tr>
      <td>${c.creator_name}</td>
      <td>${c.country}</td>
      <td>${c.language}</td>
      <td>${c.genre}</td>
      <td>${c.hours_watched.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>${c.views.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>$${c.creator_rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>$${c.emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="color: ${c.roi >= 1 ? '#8FDDAD' : '#E79B81'}">${c.roi.toFixed(2)}x</td>
    </tr>`).join('');
  } else {
    // YouTube/TikTok table - includes engagement columns
    thead.innerHTML = `<tr>
      <th>Creator</th><th>Country</th><th>Language</th><th>Genre</th>
      <th>Views</th><th>Creator Rate</th><th>EMV</th><th>ROI</th>
      <th>Engagement</th><th>Eng. Rate</th>
    </tr>`;

    tbody.innerHTML = data.map(c => `<tr>
      <td>${c.creator_name}</td>
      <td>${c.country}</td>
      <td>${c.language}</td>
      <td>${c.genre}</td>
      <td>${c.views.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>$${c.creator_rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>$${c.emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="color: ${c.roi >= 1 ? '#8FDDAD' : '#E79B81'}">${c.roi.toFixed(2)}x</td>
      <td>${c.engagement.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>${c.engagement_rate.toFixed(2)}%</td>
    </tr>`).join('');
  }
}

let chartInstances = [];

function drawReportCharts(data) {
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];

  const colors = ['#A985DE', '#89BEED', '#8FDDAD', '#ECE970', '#E79B81', '#ECE1F9', '#E1EFFA', '#E2F7EA'];
  const labels = data.map(c => c.creator_name);

  // ROI by Creator
  chartInstances.push(new Chart(
    document.getElementById('chart-roi'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'ROI',
          data: data.map(c => c.roi),
          backgroundColor: data.map(c => c.roi >= 1 ? '#8FDDAD' : '#E79B81'),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: val => val + 'x' } } }
      }
    }
  ));

  // EMV Distribution (doughnut)
  chartInstances.push(new Chart(
    document.getElementById('chart-emv'),
    {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: data.map(c => c.emv),
          backgroundColor: colors.slice(0, data.length),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } }
      }
    }
  ));

  // Top Performers (horizontal bar)
  const topPerformers = [...data].sort((a, b) => b.emv - a.emv).slice(0, 5);
  chartInstances.push(new Chart(
    document.getElementById('chart-top-performers'),
    {
      type: 'bar',
      data: {
        labels: topPerformers.map(c => c.creator_name),
        datasets: [{
          label: 'EMV',
          data: topPerformers.map(c => c.emv),
          backgroundColor: '#A985DE',
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { callback: val => '$' + val.toLocaleString() } } }
      }
    }
  ));

  // Genre Performance
  const genreData = {};
  data.forEach(c => {
    if (!genreData[c.genre]) genreData[c.genre] = 0;
    genreData[c.genre] += c.emv;
  });
  chartInstances.push(new Chart(
    document.getElementById('chart-genre'),
    {
      type: 'pie',
      data: {
        labels: Object.keys(genreData),
        datasets: [{
          data: Object.values(genreData),
          backgroundColor: colors.slice(0, Object.keys(genreData).length),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } }
      }
    }
  ));

  // Country Performance
  const countryData = {};
  data.forEach(c => {
    if (!countryData[c.country]) countryData[c.country] = 0;
    countryData[c.country] += c.emv;
  });
  chartInstances.push(new Chart(
    document.getElementById('chart-country'),
    {
      type: 'pie',
      data: {
        labels: Object.keys(countryData),
        datasets: [{
          data: Object.values(countryData),
          backgroundColor: colors.slice(0, Object.keys(countryData).length),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } }
      }
    }
  ));

  // Investment vs Return
  chartInstances.push(new Chart(
    document.getElementById('chart-investment'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Investment',
            data: data.map(c => c.creator_rate),
            backgroundColor: '#E79B81',
          },
          {
            label: 'EMV Return',
            data: data.map(c => c.emv),
            backgroundColor: '#8FDDAD',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { ticks: { callback: val => '$' + val.toLocaleString() } } }
      }
    }
  ));
}

// ============================================================
// EXPORT & PRINT
// ============================================================

document.getElementById('download-report-csv').addEventListener('click', () => {
  if (!window._reportData) return;

  const data = window._reportData;
  const headers = ['Creator', 'Country', 'Language', 'Genre', 'Views', 'Creator Rate', 'EMV', 'ROI', 'Engagement', 'Engagement Rate'];

  const rows = data.map(c => [
    c.creator_name, c.country, c.language, c.genre,
    c.views, c.creator_rate.toFixed(2), c.emv.toFixed(2), c.roi.toFixed(2),
    c.engagement, c.engagement_rate.toFixed(2)
  ]);

  const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
  downloadFile(csvContent, 'campaign-report.csv', 'text/csv');
});

document.getElementById('print-report').addEventListener('click', () => {
  window.print();
});

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
