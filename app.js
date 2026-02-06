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
    let accv = 0;
    let hoursStreamed = 0;

    // Detect platform from row data
    const isTwitch = row.accv !== undefined && row.accv !== '';

    if (isTwitch) {
      // Twitch calculations
      accv = parseNum(row.accv);
      hoursStreamed = parseNum(row.hours_streamed);
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
      accv: Math.round(accv * 100) / 100,
      hours_streamed: Math.round(hoursStreamed * 100) / 100,
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

  // Generate executive summary paragraph
  generateExecutiveSummary(data, totals, overallROI, isTwitchCampaign);

  // Generate insights
  generateInsights(data, totals, isTwitchCampaign);

  // Build table
  buildReportTable(data, isTwitchCampaign);

  // Draw charts
  drawReportCharts(data, totals);

  // Generate recommendations
  generateRecommendations(data, totals, overallROI, isTwitchCampaign);

  // Store for export
  window._reportData = data;
  window._isTwitchCampaign = isTwitchCampaign;
}

function generateExecutiveSummary(data, totals, overallROI, isTwitchCampaign) {
  const topPerformer = data.reduce((max, c) => c.emv > max.emv ? c : max, data[0]);
  const worstPerformer = data.filter(c => c.roi > 0).reduce((min, c) => c.roi < min.roi ? c : min, data[0]);

  // Calculate performance distribution
  const highPerformers = data.filter(c => c.roi >= 1.5).length;
  const midPerformers = data.filter(c => c.roi >= 0.8 && c.roi < 1.5).length;
  const lowPerformers = data.filter(c => c.roi > 0 && c.roi < 0.8).length;

  // Genre analysis
  const genreData = {};
  data.forEach(c => {
    if (c.genre !== 'N/A') {
      if (!genreData[c.genre]) genreData[c.genre] = { emv: 0, cost: 0, count: 0 };
      genreData[c.genre].emv += c.emv;
      genreData[c.genre].cost += c.creator_rate;
      genreData[c.genre].count++;
    }
  });
  const bestGenre = Object.entries(genreData).sort((a, b) => (b[1].emv / b[1].cost) - (a[1].emv / a[1].cost))[0];

  // Country analysis
  const countryData = {};
  data.forEach(c => {
    if (c.country !== 'N/A') {
      if (!countryData[c.country]) countryData[c.country] = { emv: 0, cost: 0, count: 0 };
      countryData[c.country].emv += c.emv;
      countryData[c.country].cost += c.creator_rate;
      countryData[c.country].count++;
    }
  });
  const bestCountry = Object.entries(countryData).sort((a, b) => (b[1].emv / b[1].cost) - (a[1].emv / a[1].cost))[0];

  const roiClass = overallROI >= 1 ? 'highlight-positive' : 'highlight-negative';
  const roiVerdict = overallROI >= 1.5 ? 'significantly exceeded expectations' :
                     overallROI >= 1 ? 'met return objectives' :
                     overallROI >= 0.7 ? 'fell slightly below target' : 'underperformed expectations';

  let summaryText = `
    <p>This campaign engaged <strong>${totals.creators} creator${totals.creators > 1 ? 's' : ''}</strong>
    with a total investment of <strong>$${totals.totalCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>,
    generating <strong>$${totals.totalEMV.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> in estimated media value
    across <strong>${totals.totalViews.toLocaleString('en-US', {maximumFractionDigits: 0})}</strong> total views.
    The overall campaign ROI of <span class="${roiClass}">${overallROI.toFixed(2)}x</span> ${roiVerdict}.</p>

    <p><strong>${topPerformer.creator_name}</strong> emerged as the top performer, delivering
    <strong>$${topPerformer.emv.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> EMV
    with an ROI of <span class="highlight-positive">${topPerformer.roi.toFixed(2)}x</span>.`;

  if (highPerformers > 0) {
    const highPct = Math.round((highPerformers / totals.creators) * 100);
    summaryText += ` ${highPerformers} creator${highPerformers > 1 ? 's' : ''} (${highPct}%) delivered exceptional returns above 1.5x ROI.`;
  }

  if (lowPerformers > 0 && worstPerformer) {
    summaryText += ` However, <strong>${worstPerformer.creator_name}</strong> underperformed with only
    <span class="highlight-negative">${worstPerformer.roi.toFixed(2)}x</span> ROI, suggesting partnership terms should be reviewed.`;
  }

  summaryText += `</p>`;

  if (bestGenre) {
    const genreROI = bestGenre[1].cost > 0 ? (bestGenre[1].emv / bestGenre[1].cost) : 0;
    const genrePct = Math.round((bestGenre[1].emv / totals.totalEMV) * 100);
    summaryText += `<p>From a category perspective, <strong>${bestGenre[0]}</strong> content drove ${genrePct}% of total EMV
    with a ${genreROI.toFixed(2)}x ROI, indicating strong audience resonance in this vertical.`;
  }

  if (bestCountry) {
    const countryROI = bestCountry[1].cost > 0 ? (bestCountry[1].emv / bestCountry[1].cost) : 0;
    const countryPct = Math.round((bestCountry[1].emv / totals.totalEMV) * 100);
    summaryText += ` Geographically, <strong>${bestCountry[0]}</strong> creators contributed ${countryPct}% of EMV
    at ${countryROI.toFixed(2)}x ROI.</p>`;
  }

  document.getElementById('summary-paragraph').innerHTML = summaryText;
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

  // Underperformers warning - name the worst one
  const underperformers = data.filter(c => c.roi > 0 && c.roi < 0.8);
  if (underperformers.length > 0) {
    const worstPerformer = underperformers.reduce((min, c) => c.roi < min.roi ? c : min, underperformers[0]);
    insights.push({
      type: 'warning',
      title: 'Lowest ROI Creator',
      value: worstPerformer.creator_name,
      detail: worstPerformer.roi.toFixed(2) + 'x ROI ($' + worstPerformer.emv.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' EMV from $' + worstPerformer.creator_rate.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' investment)'
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
    // Twitch table - includes ACCV, no engagement columns
    thead.innerHTML = `<tr>
      <th>Creator</th><th>Country</th><th>Language</th><th>Genre</th>
      <th>ACCV</th><th>Hours Watched</th><th>Views</th><th>Creator Rate</th><th>EMV</th><th>ROI</th>
    </tr>`;

    tbody.innerHTML = data.map(c => `<tr>
      <td>${c.creator_name}</td>
      <td>${c.country}</td>
      <td>${c.language}</td>
      <td>${c.genre}</td>
      <td>${c.accv.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
      <td>${c.hours_watched.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>${c.views.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
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

function drawReportCharts(data, totals) {
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

  // EMV Distribution (doughnut) with percentages
  const totalEMV = data.reduce((sum, c) => sum + c.emv, 0);
  chartInstances.push(new Chart(
    document.getElementById('chart-emv'),
    {
      type: 'doughnut',
      data: {
        labels: data.map(c => {
          const pct = totalEMV > 0 ? Math.round((c.emv / totalEMV) * 100) : 0;
          return `${c.creator_name} (${pct}%)`;
        }),
        datasets: [{
          data: data.map(c => c.emv),
          backgroundColor: colors.slice(0, data.length),
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw;
                const pct = totalEMV > 0 ? Math.round((value / totalEMV) * 100) : 0;
                return `$${value.toLocaleString('en-US', {minimumFractionDigits: 2})} (${pct}% of total)`;
              }
            }
          }
        }
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

  // Genre Performance with ROI analysis
  const genreAnalysis = {};
  data.forEach(c => {
    if (c.genre !== 'N/A') {
      if (!genreAnalysis[c.genre]) genreAnalysis[c.genre] = { emv: 0, cost: 0, count: 0 };
      genreAnalysis[c.genre].emv += c.emv;
      genreAnalysis[c.genre].cost += c.creator_rate;
      genreAnalysis[c.genre].count++;
    }
  });
  const genreLabels = Object.entries(genreAnalysis).map(([genre, d]) => {
    const roi = d.cost > 0 ? (d.emv / d.cost).toFixed(2) : '0.00';
    const pct = totalEMV > 0 ? Math.round((d.emv / totalEMV) * 100) : 0;
    return `${genre} (${pct}% EMV, ${roi}x ROI)`;
  });
  chartInstances.push(new Chart(
    document.getElementById('chart-genre'),
    {
      type: 'pie',
      data: {
        labels: genreLabels,
        datasets: [{
          data: Object.values(genreAnalysis).map(d => d.emv),
          backgroundColor: colors.slice(0, Object.keys(genreAnalysis).length),
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 9 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const genre = Object.keys(genreAnalysis)[context.dataIndex];
                const d = genreAnalysis[genre];
                const roi = d.cost > 0 ? (d.emv / d.cost).toFixed(2) : '0.00';
                return [`EMV: $${d.emv.toLocaleString('en-US', {minimumFractionDigits: 2})}`, `Cost: $${d.cost.toLocaleString('en-US', {minimumFractionDigits: 2})}`, `ROI: ${roi}x`, `Creators: ${d.count}`];
              }
            }
          }
        }
      }
    }
  ));

  // Country Performance with ROI analysis
  const countryAnalysis = {};
  data.forEach(c => {
    if (c.country !== 'N/A') {
      if (!countryAnalysis[c.country]) countryAnalysis[c.country] = { emv: 0, cost: 0, count: 0 };
      countryAnalysis[c.country].emv += c.emv;
      countryAnalysis[c.country].cost += c.creator_rate;
      countryAnalysis[c.country].count++;
    }
  });
  const countryLabels = Object.entries(countryAnalysis).map(([country, d]) => {
    const roi = d.cost > 0 ? (d.emv / d.cost).toFixed(2) : '0.00';
    const pct = totalEMV > 0 ? Math.round((d.emv / totalEMV) * 100) : 0;
    return `${country} (${pct}% EMV, ${roi}x ROI)`;
  });
  chartInstances.push(new Chart(
    document.getElementById('chart-country'),
    {
      type: 'pie',
      data: {
        labels: countryLabels,
        datasets: [{
          data: Object.values(countryAnalysis).map(d => d.emv),
          backgroundColor: colors.slice(0, Object.keys(countryAnalysis).length),
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 9 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const country = Object.keys(countryAnalysis)[context.dataIndex];
                const d = countryAnalysis[country];
                const roi = d.cost > 0 ? (d.emv / d.cost).toFixed(2) : '0.00';
                return [`EMV: $${d.emv.toLocaleString('en-US', {minimumFractionDigits: 2})}`, `Cost: $${d.cost.toLocaleString('en-US', {minimumFractionDigits: 2})}`, `ROI: ${roi}x`, `Creators: ${d.count}`];
              }
            }
          }
        }
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
// STRATEGIC RECOMMENDATIONS
// ============================================================

function generateRecommendations(data, totals, overallROI, isTwitchCampaign) {
  const recommendations = [];

  // Analyze genre performance
  const genreData = {};
  data.forEach(c => {
    if (c.genre !== 'N/A') {
      if (!genreData[c.genre]) genreData[c.genre] = { emv: 0, cost: 0, count: 0, creators: [] };
      genreData[c.genre].emv += c.emv;
      genreData[c.genre].cost += c.creator_rate;
      genreData[c.genre].count++;
      genreData[c.genre].creators.push(c);
    }
  });

  const genrePerformance = Object.entries(genreData)
    .map(([genre, d]) => ({ genre, roi: d.cost > 0 ? d.emv / d.cost : 0, emv: d.emv, cost: d.cost, count: d.count }))
    .sort((a, b) => b.roi - a.roi);

  // Analyze country performance
  const countryData = {};
  data.forEach(c => {
    if (c.country !== 'N/A') {
      if (!countryData[c.country]) countryData[c.country] = { emv: 0, cost: 0, count: 0 };
      countryData[c.country].emv += c.emv;
      countryData[c.country].cost += c.creator_rate;
      countryData[c.country].count++;
    }
  });

  const countryPerformance = Object.entries(countryData)
    .map(([country, d]) => ({ country, roi: d.cost > 0 ? d.emv / d.cost : 0, emv: d.emv, cost: d.cost, count: d.count }))
    .sort((a, b) => b.roi - a.roi);

  // Analyze individual creator performance
  const highPerformers = data.filter(c => c.roi >= 1.5).sort((a, b) => b.roi - a.roi);
  const midPerformers = data.filter(c => c.roi >= 0.8 && c.roi < 1.5);
  const lowPerformers = data.filter(c => c.roi > 0 && c.roi < 0.8).sort((a, b) => a.roi - b.roi);

  // DOUBLE DOWN - High performers and best genres/countries
  const doubleDown = [];

  if (highPerformers.length > 0) {
    const topCreators = highPerformers.slice(0, 3).map(c => c.creator_name).join(', ');
    doubleDown.push(`<strong>Increase investment</strong> in top-performing creators: ${topCreators}. These partnerships delivered exceptional ROI above 1.5x and should be prioritized for future campaigns.`);
  }

  if (genrePerformance.length > 0 && genrePerformance[0].roi >= 1) {
    const topGenre = genrePerformance[0];
    doubleDown.push(`<strong>Expand ${topGenre.genre} content</strong> activations. This genre delivered ${topGenre.roi.toFixed(2)}x ROI with $${topGenre.emv.toLocaleString('en-US', {minimumFractionDigits: 2})} EMV from ${topGenre.count} creator${topGenre.count > 1 ? 's' : ''}.`);
  }

  if (countryPerformance.length > 0 && countryPerformance[0].roi >= 1) {
    const topCountry = countryPerformance[0];
    doubleDown.push(`<strong>Focus on ${topCountry.country} market</strong>. Creators from this region achieved ${topCountry.roi.toFixed(2)}x ROI, indicating strong audience engagement.`);
  }

  // OPTIMIZE - Mid performers and opportunities
  const optimize = [];

  if (midPerformers.length > 0) {
    optimize.push(`<strong>Renegotiate terms</strong> with ${midPerformers.length} mid-tier performer${midPerformers.length > 1 ? 's' : ''} (0.8-1.5x ROI). Consider performance-based bonuses or adjusted rates to improve returns.`);
  }

  if (genrePerformance.length > 1) {
    const underperformingGenres = genrePerformance.filter(g => g.roi < 1 && g.roi > 0);
    if (underperformingGenres.length > 0) {
      optimize.push(`<strong>Review ${underperformingGenres[0].genre} content strategy</strong>. This genre underperformed at ${underperformingGenres[0].roi.toFixed(2)}x ROI. Consider adjusting creative briefs or targeting different creators in this space.`);
    }
  }

  if (!isTwitchCampaign) {
    const lowEngagement = data.filter(c => c.engagement_rate > 0 && c.engagement_rate < 2);
    if (lowEngagement.length > 0) {
      optimize.push(`<strong>Improve content engagement</strong> for ${lowEngagement.length} creator${lowEngagement.length > 1 ? 's' : ''} with sub-2% engagement rates. Consider more authentic integrations or different content formats.`);
    }
  }

  // AVOID - Low performers and poor ROI areas
  const avoid = [];

  if (lowPerformers.length > 0) {
    const worstCreators = lowPerformers.slice(0, 2).map(c => `${c.creator_name} (${c.roi.toFixed(2)}x)`).join(', ');
    avoid.push(`<strong>Reconsider partnerships</strong> with underperforming creators: ${worstCreators}. These partnerships did not deliver adequate returns on investment.`);
  }

  if (countryPerformance.length > 0) {
    const worstCountry = countryPerformance[countryPerformance.length - 1];
    if (worstCountry.roi < 0.8 && worstCountry.roi > 0) {
      avoid.push(`<strong>Reduce ${worstCountry.country} exposure</strong>. This market delivered only ${worstCountry.roi.toFixed(2)}x ROI. Consider reallocating budget to higher-performing regions.`);
    }
  }

  // FUTURE OPPORTUNITIES
  const future = [];

  if (overallROI >= 1) {
    const budgetIncrease = Math.round((overallROI - 1) * 100);
    future.push(`<strong>Scale campaign budget</strong>. With ${overallROI.toFixed(2)}x overall ROI, consider increasing investment by ${Math.min(budgetIncrease, 50)}% for the next activation.`);
  }

  if (highPerformers.length > 0) {
    future.push(`<strong>Develop long-term partnerships</strong> with top ${Math.min(highPerformers.length, 3)} creators. Ambassador programs or multi-campaign deals could secure favorable rates and deeper audience connections.`);
  }

  if (genrePerformance.length > 0 && genrePerformance[0].count < 3) {
    future.push(`<strong>Test more ${genrePerformance[0].genre} creators</strong>. Strong ROI with limited sample size suggests opportunity to expand in this vertical.`);
  }

  // Build HTML
  let html = '';

  if (doubleDown.length > 0) {
    html += `
      <div class="recommendation-category double-down">
        <h4>Double Down</h4>
        <ul>${doubleDown.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    `;
  }

  if (optimize.length > 0) {
    html += `
      <div class="recommendation-category optimize">
        <h4>Optimize</h4>
        <ul>${optimize.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    `;
  }

  if (avoid.length > 0) {
    html += `
      <div class="recommendation-category avoid">
        <h4>Reconsider</h4>
        <ul>${avoid.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    `;
  }

  if (future.length > 0) {
    html += `
      <div class="recommendation-category future">
        <h4>Future Opportunities</h4>
        <ul>${future.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    `;
  }

  if (html === '') {
    html = '<p>Insufficient data to generate strategic recommendations. Ensure campaign data includes genre, country, and performance metrics.</p>';
  }

  document.getElementById('recommendations-content').innerHTML = html;
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
