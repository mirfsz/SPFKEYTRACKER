import React from 'react';
import { COMPANIES } from '../data/keyData';

const CompanyNav = ({ currentCompany, onSelectCompany }) => (
  <label className="company-picker">
    <span>Company</span>
    <span className="company-select-wrap"><select value={currentCompany} onChange={(event) => onSelectCompany(event.target.value)}>
      {COMPANIES.map((company) => <option key={company} value={company}>{company}</option>)}
    </select><svg className="company-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg></span>
  </label>
);

export default CompanyNav;
