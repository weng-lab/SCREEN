#pragma once

namespace SCREEN {

  typedef std::function<bool (std::vector<std::string>&)> RegionFilter;

  RegionFilter QFilter(float);

} // SCREEN
