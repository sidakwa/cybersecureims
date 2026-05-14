/**
 * Normalize work package data from database to frontend format
 */
export function normalizeWorkPackage(wp: any) {
  return {
    id: wp.wp_id,
    code: wp.wp_code,
    name: wp.wp_name,
    status: wp.status,
    owner: wp.owner,
    created_at: wp.created_at
  };
}

/**
 * Normalize UCI control data from database to frontend format
 */
export function normalizeControl(c: any) {
  return {
    id: c.id,
    code: c.control_code,
    name: c.control_name,
    title: c.control_name,
    status: c.uci_status,
    maturity: {
      current: c.current_maturity,
      target: c.target_maturity
    },
    responsible: c.responsible,
    accountable: c.accountable,
    work_package_id: c.work_package_id
  };
}

/**
 * Normalize risk data
 */
export function normalizeRisk(r: any) {
  return {
    id: r.id,
    title: r.risk_title,
    description: r.risk_description,
    likelihood: r.likelihood,
    impact: r.impact,
    score: r.risk_score,
    status: r.status,
    work_package_id: r.work_package_id
  };
}

/**
 * Normalize CSI item
 */
export function normalizeCSIItem(item: any) {
  return {
    id: item.id,
    title: item.item_title,
    description: item.description,
    priority: item.priority,
    status: item.status,
    work_package_id: item.work_package_id
  };
}
