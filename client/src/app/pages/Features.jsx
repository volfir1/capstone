import { Box } from "@mantine/core";
import { HomepageHeader, HomepageFooter } from "./main/common/index";
import { CoreFeatures, CTA, HeroSection, IntegratedSection, SecurityFeatures, TechnicalFeatures,WorkFlowSection} from './main/features/index'


export default function FeaturesPage() {
  return (
    <Box>
      <HomepageHeader />
      <Box style={{ backgroundColor: 'white' }}>
        <HeroSection />
        <CoreFeatures/>
        <SecurityFeatures />
        <WorkFlowSection />
        <TechnicalFeatures />
        <IntegratedSection/>
        <CTA/>
        <HomepageFooter />
      </Box>
    </Box>
  );
}