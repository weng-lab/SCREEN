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
#CPPCMS = -isystem$(LOCAL_PATH)/cppcms/include
ARAMADILLO = -isystem$(LOCAL_PATH)/armadillo/include
ZI = -I$(LOCAL_PATH)/zi_lib
#BAMTOOLS = -I$(LOCAL_PATH)/bamtools/include/bamtools
JSONCPP = -I$(LOCAL_PATH)/jsoncpp/include
#MATHGL = -I$(LOCAL_PATH)/mathgl/include
LOCALTOOLS = -I$(LOCAL_PATH)
LIBSVM = -I$(LOCAL_PATH)/libsvm
EXTTOOLS = -I$(EXT_PATH)
LIBLINEAR = -I$(LOCAL_PATH)/liblinear
#DLIB = -I$(LOCAL_PATH)/dlib
SRC = -I./src/
#QT = -I/usr/include/qt5/QtWidgets -I/usr/include/qt5/QtCore -I/usr/include/qt5/QtGui -I/usr/include/qt5/QtOpengl -I/usr/include/qt5/ -I/usr/include/qt5/QtQuick

LD_FLAGS = -fopenmp -lz

#LD_FLAGS += -ltcmalloc_minimal

LD_FLAGS += -Wl,-rpath,/share/pkg/bzip2/1.0.6/lib -L/share/pkg/bzip2/1.0.6/lib/lib

#boost
LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/boost/lib -L$(LOCAL_PATH)/boost/lib  \
	-lpthread -lboost_system -lboost_log  -lboost_thread \
	-lboost_filesystem -lboost_iostreams -lboost_regex -lboost_serialization
#cppcms
#LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/cppcms/lib -L$(LOCAL_PATH)/cppcms/lib  \
#	-lcppcms -lbooster
#mathgl
#LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/mathgl/lib -L$(LOCAL_PATH)/mathgl/lib  \
	-lmgl-qt -lmgl
#armadillo
LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/armadillo/lib -L$(LOCAL_PATH)/armadillo/lib  \
	-larmadillo
#curl
LD_FLAGS += -lcurl

#liblinear
LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/liblinear -L$(LOCAL_PATH)/liblinear  -llinear

#bamtools
#LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/bamtools/lib/bamtools -L$(LOCAL_PATH)/bamtools/lib/bamtools\
	-lbamtools

#jsoncpp
LD_FLAGS += -Wl,-rpath,$(LOCAL_PATH)/jsoncpp/lib -L$(LOCAL_PATH)/jsoncpp/lib\
	-ljsoncpp

#jpeg
#LD_FLAGS += -ljpeg

ifeq ($(UNAME_S),Darwin)
    LD_FLAGS += -llapack  -lcblas # non-threaded
    LD_FLAGS += -headerpad_max_install_names
else
    LD_FLAGS += -lrt
    LD_FLAGS += -lcblas -latlas
endif

ifndef NO_R
	include ../r-makefile-common.mk
endif

#LD_FLAGS += -lQt5Core -lQt5Gui -lQt5Quick

#COMLIBS = $(LOCALTOOLS) $(BOOST) $(ZI) $(EXTTOOLS) $(MATHGL) $(CPPCMS) $(ARAMADILLO) $(BAMTOOLS) $(SRC) $(QT) $(LIBLINEAR) $(DLIB) $(JSONCPP)
COMLIBS = $(LOCALTOOLS) $(BOOST) $(ZI) $(EXTTOOLS) $(ARAMADILLO) $(SRC) $(LIBLINEAR) $(JSONCPP)
COMMON_OPT = $(CXXFLAGS) $(CXXOPT) $(COMLIBS)
COMMON_DEBUG = $(CXXFLAGS) $(CXXDEBUG) $(COMLIBS)

# from http://stackoverflow.com/a/18258352
rwildcard=$(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2) $(filter $(subst *,%,$2),$d))
