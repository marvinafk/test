// ============================================================
// Campaign ROI Calculator & Automated Report Generator
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

// --- Core Calculation Engine ---
// This is the heart of the app. It takes raw campaign numbers
// and returns all the marketing metrics you'd put in a report.
function calculateMetrics(data) {
  const spend = parseFloat(data.spend) || 0;
  const impressions = parseInt(data.impressions) || 0;
  const clicks = parseInt(data.clicks) || 0;
  const conversions = parseInt(data.conversions) || 0;
  const revenue = parseFloat(data.revenue) || 0;
  const engagements = parseInt(data.engagements) || 0;

  return {
    campaign_name: data.campaign_name || '',
    platform: data.platform || '',
    spend,
    impressions,
    clicks,
    conversions,
    revenue,
    engagements,
    // CPM = Cost Per Mille (cost per 1,000 impressions)
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    // CPC = Cost Per Click
    cpc: clicks > 0 ? spend / clicks : 0,
    // CPA = Cost Per Acquisition (cost per conversion)
    cpa: conversions > 0 ? spend / conversions : 0,
    // CTR = Click-Through Rate (what % of people who saw it clicked)
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    // Conversion Rate (what % of clickers converted)
    conversion_rate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    // Engagement Rate (what % of impressions led to engagement)
    engagement_rate: impressions > 0 ? (engagements / impressions) * 100 : 0,
    // ROI % = Return on Investment
    roi: spend > 0 ? ((revenue - spend) / spend) * 100 : 0,
    // ROAS = Return on Ad Spend (revenue per dollar spent)
    roas: spend > 0 ? revenue / spend : 0,
    // Net profit
    profit: revenue - spend,
  };
}

// --- Format helpers ---
function formatCurrency(val) {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(val) {
  return val.toLocaleString('en-US');
}

function formatPercent(val) {
  return val.toFixed(2) + '%';
}

// ============================================================
// INFLUENCER ROI CALCULATOR
// ============================================================

// --- Platform Switching ---
// Show/hide fields based on selected platform
const platformSelect = document.getElementById('platform');
const twitchFields = document.getElementById('twitch-fields');
const youtubeFields = document.getElementById('youtube-fields');
const tiktokFields = document.getElementById('tiktok-fields');

platformSelect.addEventListener('change', () => {
  const platform = platformSelect.value;

  // Hide all platform fields first
  twitchFields.classList.add('hidden');
  youtubeFields.classList.add('hidden');
  tiktokFields.classList.add('hidden');

  // Show the selected platform's fields
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
const twitchEMV = document.getElementById('twitch-emv');
const twitchCreatorRate = document.getElementById('twitch-creator-rate');
const twitchROI = document.getElementById('twitch-roi');
const twitchROIGroup = document.getElementById('twitch-roi-group');
const twitchEngagement = document.getElementById('twitch-engagement');
const twitchEngagementRate = document.getElementById('twitch-engagement-rate');
const twitchEngagementRateGroup = document.getElementById('twitch-engagement-rate-group');

function calculateTwitchMetrics() {
  const accv = parseFloat(twitchACCV.value) || 0;
  const hoursStreamed = parseFloat(twitchHoursStreamed.value) || 0;
  const creatorRate = parseFloat(twitchCreatorRate.value) || 0;
  const engagement = parseFloat(twitchEngagement.value) || 0;

  // Total Hours Watched = ACCV * Total Hours Streamed
  const hoursWatched = accv * hoursStreamed;

  // Estimated Media Value = Total Hours Watched * $1.2 USD
  const emv = hoursWatched * 1.2;

  // Display calculated values with proper number formatting
  twitchHoursWatched.value = hoursWatched.toLocaleString('en-US', { maximumFractionDigits: 1 });
  twitchEMV.value = '$' + emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';

  // Show/hide ROI field and calculate if Creator Rate is provided
  if (creatorRate > 0) {
    twitchROIGroup.style.display = 'block';
    // ROI = EMV / Creator Rate
    const roi = emv / creatorRate;
    const roiClass = roi >= 1 ? 'positive' : 'negative';
    twitchROI.value = roi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    twitchROI.className = 'calculated-field result-field ' + roiClass;
  } else {
    twitchROIGroup.style.display = 'none';
    twitchROI.value = '';
  }

  // Show/hide Engagement Rate field and calculate if Engagement is provided
  if (engagement > 0 && hoursWatched > 0) {
    twitchEngagementRateGroup.style.display = 'block';
    // Engagement Rate = (Engagement / Hours Watched) * 100
    const engagementRate = (engagement / hoursWatched) * 100;
    twitchEngagementRate.value = engagementRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    twitchEngagementRate.className = 'calculated-field result-field';
  } else {
    twitchEngagementRateGroup.style.display = 'none';
    twitchEngagementRate.value = '';
  }
}

// Calculate whenever inputs change
twitchACCV.addEventListener('input', calculateTwitchMetrics);
twitchHoursStreamed.addEventListener('input', calculateTwitchMetrics);
twitchCreatorRate.addEventListener('input', calculateTwitchMetrics);
twitchEngagement.addEventListener('input', calculateTwitchMetrics);

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
  const views = parseFloat(youtubeViews.value) || 0;
  const creatorRate = parseFloat(youtubeCreatorRate.value) || 0;
  const engagement = parseFloat(youtubeEngagement.value) || 0;

  // Estimated Media Value = Total Views * $100 / 1000 = Views * 0.1
  const emv = views * 0.1;

  // Display calculated values with proper number formatting
  youtubeEMV.value = '$' + emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';

  // Show/hide ROI and Actual CPM fields if Creator Rate is provided
  if (creatorRate > 0 && views > 0) {
    youtubeROIGroup.style.display = 'block';
    youtubeCPMGroup.style.display = 'block';

    // ROI = EMV / Creator Rate
    const roi = emv / creatorRate;
    const roiClass = roi >= 1 ? 'positive' : 'negative';
    youtubeROI.value = roi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    youtubeROI.className = 'calculated-field result-field ' + roiClass;

    // Actual CPM = (Creator Rate / Total Views) * 1000
    const cpm = (creatorRate / views) * 1000;
    youtubeCPM.value = '$' + cpm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
    youtubeCPM.className = 'calculated-field result-field';
  } else {
    youtubeROIGroup.style.display = 'none';
    youtubeCPMGroup.style.display = 'none';
    youtubeROI.value = '';
    youtubeCPM.value = '';
  }

  // Show/hide Engagement Rate field if Engagement is provided
  if (engagement > 0 && views > 0) {
    youtubeEngagementRateGroup.style.display = 'block';
    // Engagement Rate = (Engagement / Total Views) * 100
    const engagementRate = (engagement / views) * 100;
    youtubeEngagementRate.value = engagementRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    youtubeEngagementRate.className = 'calculated-field result-field';
  } else {
    youtubeEngagementRateGroup.style.display = 'none';
    youtubeEngagementRate.value = '';
  }
}

// Calculate whenever inputs change
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
  const views = parseFloat(tiktokViews.value) || 0;
  const creatorRate = parseFloat(tiktokCreatorRate.value) || 0;
  const engagement = parseFloat(tiktokEngagement.value) || 0;

  // Estimated Media Value = Total Views * $30 / 1000 = Views * 0.03
  const emv = views * 0.03;

  // Display calculated values with proper number formatting
  tiktokEMV.value = '$' + emv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';

  // Show/hide ROI and Actual CPM fields if Creator Rate is provided
  if (creatorRate > 0 && views > 0) {
    tiktokROIGroup.style.display = 'block';
    tiktokCPMGroup.style.display = 'block';

    // ROI = EMV / Creator Rate
    const roi = emv / creatorRate;
    const roiClass = roi >= 1 ? 'positive' : 'negative';
    tiktokROI.value = roi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    tiktokROI.className = 'calculated-field result-field ' + roiClass;

    // Actual CPM = (Creator Rate / Total Views) * 1000
    const cpm = (creatorRate / views) * 1000;
    tiktokCPM.value = '$' + cpm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
    tiktokCPM.className = 'calculated-field result-field';
  } else {
    tiktokROIGroup.style.display = 'none';
    tiktokCPMGroup.style.display = 'none';
    tiktokROI.value = '';
    tiktokCPM.value = '';
  }

  // Show/hide Engagement Rate field if Engagement is provided
  if (engagement > 0 && views > 0) {
    tiktokEngagementRateGroup.style.display = 'block';
    // Engagement Rate = (Engagement / Total Views) * 100
    const engagementRate = (engagement / views) * 100;
    tiktokEngagementRate.value = engagementRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    tiktokEngagementRate.className = 'calculated-field result-field';
  } else {
    tiktokEngagementRateGroup.style.display = 'none';
    tiktokEngagementRate.value = '';
  }
}

// Calculate whenever inputs change
tiktokViews.addEventListener('input', calculateTikTokMetrics);
tiktokCreatorRate.addEventListener('input', calculateTikTokMetrics);
tiktokEngagement.addEventListener('input', calculateTikTokMetrics);

// ============================================================
// CSV UPLOAD MODE
// ============================================================

// --- Drag & Drop + Click to Upload ---
const dropZone = document.getElementById('drop-zone');
const csvInput = document.getElementById('csv-input');

dropZone.addEventListener('click', () => csvInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) {
    processCSV(file);
  }
});

csvInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) processCSV(file);
});

// --- CSV Parser ---
// This reads a CSV file and turns each row into an object
// using the header row as keys. It handles quoted fields and
// trims whitespace so messy spreadsheet exports still work.
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Clean header names: lowercase, trim, replace spaces with underscores
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

// --- Process CSV File ---
function processCSV(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const rawRows = parseCSV(e.target.result);
    if (rawRows.length === 0) {
      alert('No data found in CSV. Please check the format.');
      return;
    }

    // Calculate metrics for every row
    const results = rawRows.map(row => calculateMetrics(row));
    generateReport(results);
  };
  reader.readAsText(file);
}

// --- Generate Full Report ---
function generateReport(campaigns) {
  // Show the results section
  document.getElementById('csv-results').classList.remove('hidden');
  document.getElementById('report-date').textContent =
    'Generated: ' + new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  // Calculate totals across all campaigns
  const totals = campaigns.reduce((acc, c) => ({
    spend: acc.spend + c.spend,
    revenue: acc.revenue + c.revenue,
    impressions: acc.impressions + c.impressions,
    clicks: acc.clicks + c.clicks,
    conversions: acc.conversions + c.conversions,
    engagements: acc.engagements + c.engagements,
  }), { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0, engagements: 0 });

  const totalProfit = totals.revenue - totals.spend;
  const totalROI = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
  const avgEngRate = totals.impressions > 0 ? (totals.engagements / totals.impressions) * 100 : 0;

  // Summary cards
  const summaryHTML = [
    { label: 'Total Campaigns', value: campaigns.length, type: '' },
    { label: 'Total Spend', value: formatCurrency(totals.spend), type: '' },
    { label: 'Total Revenue', value: formatCurrency(totals.revenue), type: 'highlight' },
    { label: 'Net Profit', value: formatCurrency(totalProfit), type: totalProfit >= 0 ? 'highlight' : 'warn' },
    { label: 'Overall ROI', value: formatPercent(totalROI), type: totalROI >= 0 ? 'highlight' : 'warn' },
    { label: 'Avg Engagement Rate', value: formatPercent(avgEngRate), type: '' },
  ].map(card => `
    <div class="summary-card ${card.type}">
      <div class="card-label">${card.label}</div>
      <div class="card-value">${card.value}</div>
    </div>
  `).join('');

  document.getElementById('summary-cards').innerHTML = summaryHTML;

  // Build the detail table
  buildTable(campaigns);

  // Draw charts
  drawCharts(campaigns);

  // Store for CSV export
  window._reportCampaigns = campaigns;
}

// --- Detail Table ---
function buildTable(campaigns) {
  const thead = document.querySelector('#report-table thead');
  const tbody = document.querySelector('#report-table tbody');

  thead.innerHTML = `<tr>
    <th>Campaign</th><th>Platform</th><th>Spend</th><th>Revenue</th>
    <th>Profit</th><th>ROI %</th><th>ROAS</th><th>CPM</th>
    <th>CPC</th><th>CPA</th><th>CTR</th><th>Conv. Rate</th><th>Eng. Rate</th>
  </tr>`;

  tbody.innerHTML = campaigns.map(c => `<tr>
    <td>${c.campaign_name}</td>
    <td>${c.platform}</td>
    <td>${formatCurrency(c.spend)}</td>
    <td>${formatCurrency(c.revenue)}</td>
    <td style="color: ${c.profit >= 0 ? '#8FDDAD' : '#E79B81'}">${formatCurrency(c.profit)}</td>
    <td style="color: ${c.roi >= 0 ? '#8FDDAD' : '#E79B81'}">${formatPercent(c.roi)}</td>
    <td>${c.roas.toFixed(2)}x</td>
    <td>${formatCurrency(c.cpm)}</td>
    <td>${formatCurrency(c.cpc)}</td>
    <td>${formatCurrency(c.cpa)}</td>
    <td>${formatPercent(c.ctr)}</td>
    <td>${formatPercent(c.conversion_rate)}</td>
    <td>${formatPercent(c.engagement_rate)}</td>
  </tr>`).join('');
}

// --- Charts ---
let chartInstances = [];

function drawCharts(campaigns) {
  // Destroy old charts if re-uploading
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];

  const labels = campaigns.map(c => c.campaign_name);
  // AFK Brand Colors
  const colors = [
    '#A985DE', '#89BEED', '#8FDDAD', '#ECE970',
    '#E79B81', '#ECE1F9', '#E1EFFA', '#E2F7EA',
    '#F6F6C2', '#F5E5E3', '#888888', '#FFFFFF'
  ];

  // Chart 1: Spend vs Revenue (bar chart)
  chartInstances.push(new Chart(
    document.getElementById('chart-spend-revenue'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Spend',
            data: campaigns.map(c => c.spend),
            backgroundColor: '#A985DE',
          },
          {
            label: 'Revenue',
            data: campaigns.map(c => c.revenue),
            backgroundColor: '#8FDDAD',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => '$' + val.toLocaleString()
            }
          }
        }
      }
    }
  ));

  // Chart 2: ROI % (bar chart)
  chartInstances.push(new Chart(
    document.getElementById('chart-roi'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'ROI %',
          data: campaigns.map(c => c.roi),
          backgroundColor: campaigns.map(c => c.roi >= 0 ? '#8FDDAD' : '#E79B81'),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: { callback: val => val + '%' }
          }
        }
      }
    }
  ));

  // Chart 3: Engagement Rate (horizontal bar)
  chartInstances.push(new Chart(
    document.getElementById('chart-engagement'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Engagement Rate %',
          data: campaigns.map(c => c.engagement_rate),
          backgroundColor: '#89BEED',
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { callback: val => val + '%' }
          }
        }
      }
    }
  ));

  // Chart 4: Spend by Platform (doughnut)
  const platformSpend = {};
  campaigns.forEach(c => {
    platformSpend[c.platform] = (platformSpend[c.platform] || 0) + c.spend;
  });

  chartInstances.push(new Chart(
    document.getElementById('chart-platform'),
    {
      type: 'doughnut',
      data: {
        labels: Object.keys(platformSpend),
        datasets: [{
          data: Object.values(platformSpend),
          backgroundColor: colors.slice(0, Object.keys(platformSpend).length),
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    }
  ));
}

// ============================================================
// EXPORT & DOWNLOAD FEATURES
// ============================================================

// --- Download Report as CSV ---
document.getElementById('download-report-csv').addEventListener('click', () => {
  if (!window._reportCampaigns) return;

  const campaigns = window._reportCampaigns;
  const headers = [
    'Campaign', 'Platform', 'Spend', 'Revenue', 'Profit', 'ROI %', 'ROAS',
    'CPM', 'CPC', 'CPA', 'CTR %', 'Conversion Rate %', 'Engagement Rate %',
    'Impressions', 'Clicks', 'Conversions', 'Engagements'
  ];

  const rows = campaigns.map(c => [
    c.campaign_name, c.platform,
    c.spend.toFixed(2), c.revenue.toFixed(2), c.profit.toFixed(2),
    c.roi.toFixed(2), c.roas.toFixed(2),
    c.cpm.toFixed(2), c.cpc.toFixed(2), c.cpa.toFixed(2),
    c.ctr.toFixed(2), c.conversion_rate.toFixed(2), c.engagement_rate.toFixed(2),
    c.impressions, c.clicks, c.conversions, c.engagements
  ]);

  const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
  downloadFile(csvContent, 'campaign-report.csv', 'text/csv');
});

// --- Print Report ---
document.getElementById('print-report').addEventListener('click', () => {
  window.print();
});

// --- Download Sample CSV ---
document.getElementById('download-sample').addEventListener('click', () => {
  const sample = `campaign_name,platform,spend,impressions,clicks,conversions,revenue,engagements
Summer Skincare Launch,Instagram,5000,250000,5000,150,12000,8500
Back to School Promo,TikTok,3000,400000,8000,200,9500,15000
Holiday Gift Guide,YouTube,8000,180000,3600,300,25000,4200
Flash Sale Weekend,Instagram,2000,150000,4500,180,8000,6200
Wellness Series,Twitter/X,1500,90000,1800,50,3500,2800
Product Unboxing,TikTok,4000,500000,12000,350,18000,22000`;

  downloadFile(sample, 'sample-campaign-data.csv', 'text/csv');
});

// --- File Download Helper ---
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
