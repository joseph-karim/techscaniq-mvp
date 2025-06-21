import { motion } from 'framer-motion';
import { Calendar, Clock, FileCode } from 'lucide-react';

interface ReportHeaderProps {
  company: string;
  reportType: 'sales-intelligence' | 'pe-due-diligence';
  reportId: string;
  generatedAt: string;
  completionTime?: string;
}

export function ReportHeader({ 
  company, 
  reportType, 
  reportId, 
  generatedAt,
  completionTime 
}: ReportHeaderProps) {
  const reportTypeLabels = {
    'sales-intelligence': 'Sales Intelligence Analysis',
    'pe-due-diligence': 'Private Equity Due Diligence',
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-brand-black to-brand-gunmetal text-white p-8 md:p-12 rounded-t-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <img 
          src="/Tesch_Scan_IQ_Logo_Transparent.png" 
          alt="TechScan IQ" 
          className="h-10 md:h-12 filter brightness-0 invert mb-4 md:mb-0" 
        />
        <div className="flex flex-wrap gap-4 text-sm font-mono opacity-80">
          <span className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Report ID: {reportId}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(generatedAt).toLocaleDateString()}
          </span>
          {completionTime && (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {completionTime}
            </span>
          )}
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="font-space text-4xl md:text-5xl lg:text-6xl font-medium mb-4">
          {company} Technical Intelligence Report
        </h1>
        <p className="font-ibm text-lg md:text-xl opacity-90">
          {reportTypeLabels[reportType]}
        </p>
      </motion.div>
      
      <motion.div 
        className="mt-8 pt-8 border-t border-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <p className="font-space text-lg text-brand-teal">
          Diligence, Decoded.
        </p>
      </motion.div>
    </motion.div>
  );
}