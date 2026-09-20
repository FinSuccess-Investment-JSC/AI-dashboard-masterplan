import importlib.util
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('company_comparison',ROOT/'scripts/update_company_comparison.py');M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)

def table(periods,rows):
 return {'periods':[{'end':d,'label':l} for d,l in periods],'rows':rows,'url':'https://example.com/financials/','checked_at':'2026-09-18'}

class ComparisonTests(unittest.TestCase):
 def test_parse_multiple_sections_and_quote_date(self):
  header='<thead><tr><th>Fiscal Quarter</th><th id="TTM">Current</th><th id="2026-06-30">Q2 2026</th></tr><tr><th>Ending</th><th><span>Sep 26</span><span>Sep 17, 2026</span></th><th>Jun 30, 2026</th></tr></thead>'
  html='Millions VND.'+''.join('<table>'+header+'<tbody><tr><td>'+name+'</td><td>'+value+'</td><td>-</td></tr></tbody></table>' for name,value in [('Market Capitalization','10,000'),('PE Ratio','8.5'),('PB Ratio','1.2')])
  p=M.parse_table(html);self.assertEqual(p['periods'][0]['end'],'2026-09-17');self.assertEqual(p['rows']['PE Ratio'],[8.5,None]);self.assertEqual(p['rows']['PB Ratio'],[1.2,None])
 def test_reject_wrong_currency(self):
  with self.assertRaises(ValueError):M.parse_table('<p>Millions USD.</p><table></table>')
 def fixtures(self):
  periods=[('2026-06-30','Q2 2026'),('2026-03-31','Q1 2026')]
  return {'income_quarter':table(periods,{'Revenue':[1000,800],'Net Income to Common':[100,80],'Gross Margin':[30,25]}),'balance_quarter':table(periods,{'Total Common Equity':[600,400],'Cash & Equivalents':[3000,2000],'Short-Term Investments':[9000,8000],'Short-Term Debt':[500,400],'Current Portion of Long-Term Debt':[200,100],'Long-Term Debt':[1000,1200],'Total Assets':[2000,1500]})}
 def test_quarter_roe_units_cash_and_debt(self):
  p=M.build_period(self.fixtures(),'quarter')['values'];self.assertEqual(p['roe'],20);self.assertEqual(p['cash'],3);self.assertEqual(p['short_debt'],.7);self.assertEqual(p['long_debt'],1);self.assertEqual(p['net_margin'],10)
 def test_missing_is_not_zero(self):
  f=self.fixtures();del f['balance_quarter']['rows']['Current Portion of Long-Term Debt'];self.assertIsNone(M.build_period(f,'quarter')['values']['short_debt'])
 def test_missing_opening_quarter_does_not_use_older_equity(self):
  f=self.fixtures();f['balance_quarter']['periods'][1]={'end':'2025-12-31','label':'Q4 2025'};self.assertIsNone(M.build_period(f,'quarter')['values']['roe'])
 def test_bank_denominator_before_credit_losses(self):
  f=self.fixtures();f['income_quarter']['rows'].update({'Revenues Before Loan Losses':[2000,1600],'Total Non-Interest Expense':[600,500]});v=M.build_period(f,'quarter')['values'];self.assertEqual(v['net_margin'],5);self.assertEqual(v['cir'],30)

if __name__=='__main__':unittest.main()
