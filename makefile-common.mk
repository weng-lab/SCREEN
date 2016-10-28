UNAME_S := $(shell uname -s)
CPP = g++
LOCAL_PATH = $(EXT_PATH)/local
CXXFLAGS = -std=c++14 -DZI_USE_OPENMP -fopenmp -Wall -fPIC
ifeq ($(UNAME_S),Darwin)
    CXXOPT = -O2 -funroll-loops -DNDEBUG --fast-math
else
    CXXOPT = -O2 -march=native -mtune=native -funroll-loops -DNDEBUG
endif
CXXOPT += -DBOOST_UBLAS_NDEBUG
CXXDEBUG = -g -gstabs+
BOOST = -isystem$(LOCAL_PATH)/boost/include -L$(LOCAL_PATH)/boost/lib -DBOOST_BIND_NO_PLACEHOLDERS -DBOOST_LOG_DYN_LINK
ARAMADILLO = -isystem$(LOCAL_PATH)/armadillo/include
ZI = -I$(LOCAL_PATH)/zi_lib
JSONCPP = -I$(LOCAL_PATH)/jsoncpp/include
EXTTOOLS = -I$(EXT_PATH)
SRC = -I./src/

#LD_FLAGS = -fopenmp -lz

#boost
#LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/boost/lib -L$(LOCAL_PATH)/boost/lib  \
#	-lpthread -lboost_system -lboost_log  -lboost_thread \
#	-lboost_filesystem -lboost_iostreams -lboost_regex -lboost_serialization

#armadillo
#LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/armadillo/lib -L$(LOCAL_PATH)/armadillo/lib -larmadillo

#curl
#LD_FLAGS += -lcurl

#jsoncpp
#LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/jsoncpp/lib -L$(LOCAL_PATH)/jsoncpp/lib -ljsoncpp

ifeq ($(UNAME_S),Darwin)
    #LD_FLAGS += -llapack  -lcblas # non-threaded
    #LD_FLAGS += -headerpad_max_install_names
else
    #LD_FLAGS += -lrt
    #LD_FLAGS += -lcblas -latlas
endif

#COMLIBS = $(LOCALTOOLS) $(EXTTOOLS) $(SRC) $(ARAMADILLO) $(BOOST) $(ZI) $(JSONCPP)
COMLIBS = $(LOCALTOOLS) $(EXTTOOLS) $(SRC)
COMMON_OPT = $(CXXFLAGS) $(CXXOPT) $(COMLIBS)
COMMON_DEBUG = $(CXXFLAGS) $(CXXDEBUG) $(COMLIBS)

# from http://stackoverflow.com/a/18258352
rwildcard=$(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2) $(filter $(subst *,%,$2),$d))
