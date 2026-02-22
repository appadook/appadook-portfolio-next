import React from 'react';
import { motion } from 'framer-motion';
import { CloudSnow, ExternalLink } from 'lucide-react';
import type { Certificate } from '@/features/public/types';

interface CertificateItemProps {
  certificate: Certificate;
  onClick: () => void;
}

const CertificateItem: React.FC<CertificateItemProps> = ({ certificate, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-gradient-subtle rounded-lg cursor-pointer hover:bg-gradient-primary/10 hover:shadow-md transition-all duration-200 group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-200">
        <CloudSnow className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm group-hover:text-primary transition-colors duration-200">
          {certificate.name}
        </p>
        <p className="text-xs text-muted-foreground">
          Certified {certificate.year}
        </p>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200 opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
};

export default CertificateItem;
