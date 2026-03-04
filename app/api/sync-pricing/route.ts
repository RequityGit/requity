/**
 * POST /api/sync-pricing
 *
 * Webhook endpoint for Make.com (or any automation) to POST raw Google Sheets
 * data and receive the formatted pricing config JSON in response.
 *
 * Make.com workflow:
 *   1. Google Sheets module → reads "Pricing Matrix" tab (all rows)
 *   2. HTTP module → POST rows to this endpoint
 *   3. This endpoint → returns formatted pricing-config JSON
 *   4. GitHub module → commits the JSON to data/pricing-config.json
 *   5. Hosting auto-deploys from the new commit
 *
 * Request body:
 *   { "rows": [ ["loan_type", "arv_label", ...], ["Fix & Flip", ...], ... ] }
 *
 * Headers:
 *   Authorization: Bearer <SYNC_PRICING_SECRET>
 */

export async function POST(request) {
  try {
    // Verify API secret
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.SYNC_PRICING_SECRET;

    if (!expectedSecret) {
      return Response.json(
        { error: 'SYNC_PRICING_SECRET environment variable is not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.rows || !Array.isArray(body.rows)) {
      return Response.json(
        { error: 'Request body must include a "rows" array (header row + data rows)' },
        { status: 400 }
      );
    }

    const config = transformSheetRows(body.rows);

    return Response.json({
      success: true,
      config,
      summary: Object.entries(config.loanPrograms).map(([type, data]) => ({
        loanType: type,
        programCount: data.programs.length,
      })),
    });
  } catch (error) {
    console.error('Sync pricing error:', error);
    return Response.json(
      { error: 'Failed to process pricing data: ' + error.message },
      { status: 500 }
    );
  }
}

function transformSheetRows(rows) {
  if (rows.length < 2) {
    throw new Error('Must have a header row and at least one data row');
  }

  const headers = rows[0].map((h) =>
    String(h).trim().toLowerCase().replace(/\s+/g, '_')
  );
  const dataRows = rows.slice(1);
  const loanPrograms = {};

  for (const row of dataRows) {
    const r = {};
    headers.forEach((header, i) => {
      r[header] = row[i] !== undefined ? String(row[i]).trim() : '';
    });

    const loanType = r.loan_type;
    if (!loanType) continue;

    if (!loanPrograms[loanType]) {
      loanPrograms[loanType] = {
        arvLabel: r.arv_label || 'Estimated Property Value',
        programs: [],
      };
    }

    if (r.program_id && r.interest_rate) {
      const highlights = [r.highlight_1, r.highlight_2, r.highlight_3].filter(Boolean);

      loanPrograms[loanType].programs.push({
        id: r.program_id,
        name: r.program_name || r.program_id,
        interestRate: parseFloat(r.interest_rate) || 0,
        rateType: r.rate_type || 'Fixed',
        originationPoints: parseFloat(r.origination_points) || 0,
        pointsNote: r.points_note || '',
        minOriginationFee: parseFloat(r.min_origination_fee) || 0,
        maxLTV: parseFloat(r.max_ltv) || 0,
        ltvNote: r.ltv_note || '',
        maxLTC: parseFloat(r.max_ltc) || 0,
        ltcNote: r.ltc_note || '',
        maxLTP: parseFloat(r.max_ltp) || 0,
        maxTerm: parseInt(r.max_term) || 12,
        termNote: r.term_note || '',
        loanTermMonths: parseInt(r.loan_term_months) || 12,
        exitPoints: parseFloat(r.exit_points) || 0,
        legalDocFee: parseFloat(r.legal_doc_fee) || 0,
        bpoAppraisalCost: parseFloat(r.bpo_appraisal_cost) || 0,
        bpoAppraisalNote: r.bpo_appraisal_note || '',
        requirements: {
          minCreditScore: parseInt(r.min_credit_score) || 0,
          minDeals24Months: parseInt(r.min_deals_24mo) || 0,
          citizenship: r.citizenship || 'any',
        },
        highlights,
      });
    }
  }

  return {
    lastSyncedAt: new Date().toISOString(),
    source: 'make_webhook',
    loanPrograms,
  };
}
