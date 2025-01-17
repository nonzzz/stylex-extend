currentDir = $(CURDIR)
JK = ./node_modules/.bin/jiek

JK_FLAGS += build
JK_FLAGS += --noMin

install:
	@echo "Setup pnpm package manager..."
	@corepack enable
	pnpm install

build-all: build-shared build-core build-babel-plugin build-vite

build-babel-plugin:
	@echo "Building babel-plugin package..."
	$(eval currentDir = $(CURDIR)/packages/babel-plugin)
	-rm -rf $(currentDir)/dist
	$(JK) $(JK_FLAGS) --filter babel-plugin

build-core: build-shared
	@echo "Building core package..."
	$(eval currentDir = $(CURDIR)/packages/core)
	-rm -rf $(currentDir)/dist
	$(JK) $(JK_FLAGS) --filter core


build-vite: build-babel-plugin
	@echo "Building vite package..."
	$(eval currentDir = $(CURDIR)/packages/vite)
	-rm -rf $(currentDir)/dist
	$(JK) $(JK_FLAGS) --external vite --filter vite

build-shared:
	@echo "Building shared package..."
	$(eval currentDir = $(CURDIR)/packages/shared)
	-rm -rf $(currentDir)/dist
	$(JK) $(JK_FLAGS) --filter shared

publish-all: build-all
	@echo "Publishing packages..."
	pnpm -r publish --no-git-checks --access public 

test:
	pnpm -r run test

cleanup-suite:
	@echo "Cleanup babel plugin ouput suite..."
	$(eval currentDir = $(CURDIR)/packages/babel-plugin/__tests__)
	find $(currentDir) -type f -name "output.js" -exec rm -f {} \;

lint:
	@echo "Linting code..."
	pnpm exec eslint --fix "packages/**/*{.ts,.tsx,.js}"

format:
	@echo "formatting code..."
	pnpm exec dprint fmt

dev-site:
	@echo "Starting dev site..."
	pnpm -C $(currentDir)/docs run dev

build-site:
	@echo "Building site..."
	pnpm -C $(currentDir)/docs run build