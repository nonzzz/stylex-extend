currentDir = $(CURDIR)

install:
	@echo "Setup pnpm package manager..."
	@corepack enable
	pnpm install

build-all: build-shared build-core build-babel-plugin

build-babel-plugin:
	@echo "Building babel-plugin package..."
	$(eval currentDir = $(CURDIR)/packages/babel-plugin)
	-rm -rf $(currentDir)/dist
	pnpm -C $(currentDir) run build

build-core: build-shared
	@echo "Building core package..."
	$(eval currentDir = $(CURDIR)/packages/core)
	-rm -rf $(currentDir)/dist
	pnpm -C $(currentDir) run build

build-shared:
	@echo "Building shared package..."
	$(eval currentDir = $(CURDIR)/packages/shared)
	-rm -rf $(currentDir)/dist
	pnpm -C $(currentDir) run build

publish-all: build-shared build-core build-babel-plugin
	@echo "Publishing packages..."
	pnpm -r publish --access public

test:
	pnpm -r run test

cleanup-suite:
	@echo "Cleanup babel plugin ouput suite..."
	$(eval currentDir = $(CURDIR)/packages/babel-plugin/__tests__)
	find $(currentDir) -type f -name "output.js" -exec rm -f {} \;