EXT_PATH=$(realpath ./external)

include ./makefile-common.mk

FLAGS = -g -std=c++14 -fPIC -fopenmp
CFLAGS = -g -std=c99 -fPIC

OBJ_DIR := build
OBJ := $(addprefix $(OBJ_DIR)/, $(patsubst %.cpp, %.o, $(call rwildcard, src/, *.cpp)))
HEADERS = $(call rwildcard, src/, *.h) \
	$(call rwildcard, src/, *.hpp) \
	$(call rwildcard, ../common/, *.h) \
	$(call rwildcard, ../common/, *.hpp) \
	$(call rwildcard, $(COMMON_PATH)/cpp/, *.h) \
	$(call rwildcard, $(COMMON_PATH)/cpp/, *.hpp)
BIN := bin/test
LIB := lib/libscreen.so
SRC = -I../ -I$(COMMON_PATH)/

.PHONY: all
all: directories $(OBJ_DIR) $(BIN) $(LIB)

$(OBJ_DIR)/%.o: %.cpp $(HEADERS)
	@mkdir -p $(OBJ_DIR)/$(shell dirname $<)
	$(CPP) $(FLAGS) $(SRC) $(COMLIBS) -c -o $@ $<

$(BIN): $(OBJ)
	$(CPP) -o $@ $^ $(LD_FLAGS)

directories:
	mkdir -p $(OBJ_DIR) bin lib

$(LIB): $(OBJ)
	$(CPP) -shared -o $@ $^ $(LD_FLAGS)

clean :
	rm -rf build/* lib/* bin/*
