EXT_PATH=$(realpath external)
COMMON_PATH=$(realpath common)
NO_R="true"

include makefile-common.mk

OBJ_DIR := build
BIGWIG := $(COMMON_PATH)/zentLib
OBJ := $(addprefix $(OBJ_DIR)/, $(patsubst %.cpp, %.o, $(call rwildcard, src/, *.cpp)))
HEADERS = $(call rwildcard, src/, *.h) \
	$(call rwildcard, src/, *.hpp) \
	$(call rwildcard, $(COMMON_PATH)/cpp/, *.h) \
	$(call rwildcard, $(COMMON_PATH)/cpp/, *.hpp)
SRC = -I../  -I$(COMMON_PATH)/
BIN := bin/read_json

.PHONY: all
all: $(OBJ_DIR) $(BIN)

$(OBJ_DIR):
	mkdir -p $(OBJ_DIR)
	mkdir -p bin

$(OBJ_DIR)/%.o: %.cpp $(HEADERS)
	@mkdir -p $(OBJ_DIR)/$(shell dirname $<)
	$(CPP) -fpermissive $(COMMON_OPT) $(SRC) -c -o $@ $<

$(BIN): $(OBJ)
	$(CPP) -o $@ $^ $(LD_FLAGS)

.PHONY : run
run: all
	@echo "******************** running ********************"
	$(BIN)
	@echo "******************** done    ********************"

.PHONY: clean
clean:
	@rm -f $(BIN)
	@rm -rf $(OBJ_DIR)

.PHONY: redo
redo: clean all
